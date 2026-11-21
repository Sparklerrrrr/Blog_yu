#!/usr/bin/env python3
"""把 RhineLabUI 的档案盒模型裁剪成博客用版本（只用标准库，无损）。

来源：https://github.com/LBEILC/RhineLabUI  public/assets/archive-cassette.glb
许可：MIT，Copyright (c) 2026 LBEILC（见 src/archive/NOTICE.md）

做了三件事：
  1. 去掉两块带「RHINE LAB, LLC.」字样的网格（Carbon_Ink 标签印字、Moulded_Lettering 侧边模压字）
     —— 这些是《明日方舟》相关标识，不在原项目 MIT 授权范围内，博客也用不到；
  2. 去掉 TEXCOORD_0（全模型没有任何贴图，UV 是纯冗余）；
  3. 把版权声明写进 glTF 的 asset.copyright。
顶点位置 / 法线 / 索引原样保留，不做量化。

用法：python3 scripts/prune-archive-model.py <原始 glb> public/archive/archive-cassette.glb
"""
import json
import struct
import sys

DROP_MATERIALS = ("Carbon_Ink", "Moulded_Lettering")
DROP_ATTRIBUTES = ("TEXCOORD_0",)


def main(source: str, target: str) -> None:
    with open(source, "rb") as f:
        magic, version, _length = struct.unpack("<4sII", f.read(12))
        assert magic == b"glTF" and version == 2, "不是 glTF 2.0 二进制文件"
        size, kind = struct.unpack("<I4s", f.read(8))
        assert kind == b"JSON"
        doc = json.loads(f.read(size))
        size, kind = struct.unpack("<I4s", f.read(8))
        assert kind == b"BIN\x00"
        blob = f.read(size)

    assert len(doc["buffers"]) == 1 and not doc.get("skins") and not doc.get("animations")
    assert all("children" not in node for node in doc["nodes"]), "只支持扁平节点结构"

    materials, accessors, views = doc["materials"], doc["accessors"], doc["bufferViews"]
    dropped = lambda index: materials[index]["name"].startswith(DROP_MATERIALS)

    out = bytearray()
    new_views, new_accessors, new_materials, new_meshes, new_nodes = [], [], [], [], []
    material_map: dict[int, int] = {}

    def copy_accessor(index: int) -> int:
        accessor = dict(accessors[index])
        view = dict(views[accessor["bufferView"]])
        assert "byteStride" not in view and "sparse" not in accessor
        start = view.get("byteOffset", 0)
        while len(out) % 4:
            out.append(0)
        view["byteOffset"] = len(out)
        out.extend(blob[start : start + view["byteLength"]])
        accessor["bufferView"] = len(new_views)
        new_views.append(view)
        new_accessors.append(accessor)
        return len(new_accessors) - 1

    removed = []
    for node in doc["nodes"]:
        mesh = doc["meshes"][node["mesh"]]
        if any(dropped(p["material"]) for p in mesh["primitives"]):
            removed.append(node["name"])
            continue
        primitives = []
        for primitive in mesh["primitives"]:
            if primitive["material"] not in material_map:
                material_map[primitive["material"]] = len(new_materials)
                new_materials.append(materials[primitive["material"]])
            primitives.append({
                **primitive,
                "attributes": {
                    name: copy_accessor(index)
                    for name, index in primitive["attributes"].items()
                    if name not in DROP_ATTRIBUTES
                },
                "indices": copy_accessor(primitive["indices"]),
                "material": material_map[primitive["material"]],
            })
        new_nodes.append({**node, "mesh": len(new_meshes)})
        new_meshes.append({**mesh, "primitives": primitives})

    while len(out) % 4:
        out.append(0)
    doc.update(
        nodes=new_nodes, meshes=new_meshes, materials=new_materials,
        accessors=new_accessors, bufferViews=new_views,
        buffers=[{"byteLength": len(out)}],
    )
    doc["scenes"] = [{"name": "Archive_Cassette", "nodes": list(range(len(new_nodes)))}]
    doc["asset"]["copyright"] = (
        "Copyright (c) 2026 LBEILC. MIT License. https://github.com/LBEILC/RhineLabUI "
        "- pruned for BLOG_YU (branding meshes and unused UVs removed)."
    )

    text = json.dumps(doc, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    text += b" " * (-len(text) % 4)
    total = 12 + 8 + len(text) + 8 + len(out)
    with open(target, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total))
        f.write(struct.pack("<I4s", len(text), b"JSON"))
        f.write(text)
        f.write(struct.pack("<I4s", len(out), b"BIN\x00"))
        f.write(out)
    print(f"removed meshes: {', '.join(removed)}")
    print(f"{len(blob) + 0:,} -> {total:,} bytes ({len(new_nodes)} meshes)")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
