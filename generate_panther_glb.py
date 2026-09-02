#!/usr/bin/env python3
"""
generate_panther_glb.py — No Blender needed.
Builds public/panther.glb as a stylized low-poly panther (boxes + spheres).
Run: python generate_panther_glb.py

NOTE: the consumer of this file (PantherBackground.tsx) was removed on 2026-09-02 — it
was imported by nothing and the 63MB GLB was being served from public/. Output is now
gitignored. Re-run only if you are adding back a 3D hero, and serve the model from a CDN
or compress it (Draco/meshopt) rather than committing it to public/.
"""
import struct, json, os, math

def box_verts(center, size):
    cx,cy,cz = center
    sx,sy,sz = size[0]/2, size[1]/2, size[2]/2
    # 8 corners
    pts = [
        (-sx,-sy,-sz),(sx,-sy,-sz),(sx,sy,-sz),(-sx,sy,-sz),
        (-sx,-sy,sz),(sx,-sy,sz),(sx,sy,sz),(-sx,sy,sz)
    ]
    return [(cx+x, cy+y, cz+z) for x,y,z in pts]

BOX_INDICES = [
    0,1,2, 0,2,3,  # -z
    4,6,5, 4,7,6,  # +z
    0,4,5, 0,5,1,  # -y
    2,6,7, 2,7,3,  # +y
    0,3,7, 0,7,4,  # -x
    1,5,6, 1,6,2,  # +x
]

def add_mesh(objects, center, size):
    verts = box_verts(center, size)
    base = len(objects["positions"])
    for v in verts:
        objects["positions"].append(v)
        # simple normal placeholder (will be flat, but ok for demo)
        objects["normals"].append((0,0,1))
    for idx in BOX_INDICES:
        objects["indices"].append(base + idx)

# Build scene
objs = {"positions": [], "normals": [], "indices": []}

# Body
add_mesh(objs, (0, 0.35, 0), (2.8, 0.85, 1.15))
# Head
add_mesh(objs, (1.55, 0.58, 0), (1.05, 0.82, 0.88))
# Snout
add_mesh(objs, (2.05, 0.40, 0), (0.55, 0.42, 0.52))
# Ears
add_mesh(objs, (1.35, 1.02, 0.28), (0.30, 0.30, 0.26))
add_mesh(objs, (1.35, 1.02, -0.28), (0.30, 0.30, 0.26))
# Legs
for x,z in [(0.65,0.35),(0.65,-0.35),(-0.65,0.35),(-0.65,-0.35)]:
    add_mesh(objs, (x, -0.28, z), (0.36, 0.72, 0.36))
# Tail
add_mesh(objs, (-1.55, 0.35, 0), (1.0, 0.20, 0.20))
# Eyes (small boxes, emissive)
eye_indices_start = len(objs["indices"])
add_mesh(objs, (1.96, 0.62, 0.22), (0.18,0.18,0.12))
add_mesh(objs, (1.96, 0.62, -0.22), (0.18,0.18,0.12))

positions = objs["positions"]
normals = objs["normals"]
indices = objs["indices"]

# Pack buffers
# Pad to 4-byte alignment
pos_bytes = b"".join(struct.pack("<3f", *p) for p in positions)
nrm_bytes = b"".join(struct.pack("<3f", *n) for n in normals)
idx_bytes = b"".join(struct.pack("<H", i) for i in indices)  # UNSIGNED_SHORT

# Ensure 4-byte alignment for each
def pad(b): return b + b"\x00" * ((4 - len(b)%4)%4)
pos_bytes = pad(pos_bytes)
nrm_bytes = pad(nrm_bytes)
idx_bytes = pad(idx_bytes)

bin_blob = pos_bytes + nrm_bytes + idx_bytes
bin_len = len(bin_blob)

pos_offset = 0
nrm_offset = len(pos_bytes)
idx_offset = len(pos_bytes) + len(nrm_bytes)

# glTF json
gltf = {
    "asset": {"version": "2.0", "generator": "generate_panther_glb.py"},
    "scene": 0,
    "scenes": [{"nodes": [0]}],
    "nodes": [{"mesh": 0, "name": "Panther"}],
    "meshes": [{
        "primitives": [{
            "attributes": {"POSITION": 0, "NORMAL": 1},
            "indices": 2,
            "material": 0
        }]
    }],
    "materials": [{
        "name": "PantherBlack",
        "pbrMetallicRoughness": {"baseColorFactor": [0.06,0.06,0.07,1.0], "metallicFactor": 0.12, "roughnessFactor": 0.55},
        "doubleSided": False
    }],
    "accessors": [
        {"bufferView": 0, "componentType": 5126, "count": len(positions), "type": "VEC3", "min": [min(p[0] for p in positions), min(p[1] for p in positions), min(p[2] for p in positions)], "max": [max(p[0] for p in positions), max(p[1] for p in positions), max(p[2] for p in positions)]},
        {"bufferView": 1, "componentType": 5126, "count": len(normals), "type": "VEC3"},
        {"bufferView": 2, "componentType": 5123, "count": len(indices), "type": "SCALAR"}
    ],
    "bufferViews": [
        {"buffer": 0, "byteOffset": pos_offset, "byteLength": len(pos_bytes), "target": 34962},
        {"buffer": 0, "byteOffset": nrm_offset, "byteLength": len(nrm_bytes), "target": 34962},
        {"buffer": 0, "byteOffset": idx_offset, "byteLength": len(idx_bytes), "target": 34963},
    ],
    "buffers": [{"byteLength": bin_len}]
}

json_str = json.dumps(gltf, separators=(",",":"))
json_bytes = json_str.encode("utf-8")
# pad json to 4 bytes with spaces
json_pad = (4 - len(json_bytes)%4)%4
json_bytes += b" " * json_pad

# GLB header: magic "glTF", version 2, total length
GLB_MAGIC = 0x46546C67
VERSION = 2
json_len = len(json_bytes)
bin_len_padded = len(bin_blob)
total_len = 12 + 8 + json_len + 8 + bin_len_padded

header = struct.pack("<3I", GLB_MAGIC, VERSION, total_len)
json_chunk_header = struct.pack("<2I", json_len, 0x4E4F534A) # JSON
bin_chunk_header = struct.pack("<2I", bin_len_padded, 0x004E4942) # BIN

glb = header + json_chunk_header + json_bytes + bin_chunk_header + bin_blob

out = os.path.join(os.path.dirname(__file__), "public", "panther.glb")
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "wb") as f:
    f.write(glb)
print(f"Wrote {out} ({len(glb)} bytes) — {len(positions)} verts, {len(indices)//3} tris")
# also verify
import json as _j
print(json.dumps(gltf["accessors"][0], indent=2))
