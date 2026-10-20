#!/usr/bin/env python3
"""shibroUI screenshot measurer: centering, item spacing and contrast from pixels (Python stdlib only).

When you only have a screenshot, no DOM script can run. This finds filled containers (pills, buttons,
chips, tracks, cards), measures the ink inside each one and reports:
  - how far the content sits off-center horizontally and vertically (SU-137)
  - the gaps between ink items in a row (uneven spacing, SU-125)
  - the contrast of the main ink color against the fill (SU-45)

Usage: python3 measure-png.py shot.png [--crop x,y,w,h] [--scale 2] [--min 16] [--json]
--scale is the screenshot's device pixel ratio; offsets are reported in CSS px. Crop to the component
you care about: smaller images are faster and the report stays focused.
"""
import argparse, json, struct, sys, zlib

TOLERANCE = 24  # max summed RGB difference for a pixel to count as the container's fill (absorbs JPEG noise)
INK_DELTA = 72  # min summed RGB difference from the fill for a pixel to count as ink (ignores halos and anti-aliasing)

def read_png(path):
    data = open(path, 'rb').read()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        sys.exit(f'{path}: not a PNG')
    pos, idat, palette = 8, b'', None
    while pos < len(data):
        length, kind = struct.unpack('>I4s', data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + length]
        if kind == b'IHDR':
            width, height, depth, ctype, _, _, interlace = struct.unpack('>IIBBBBB', body)
            if depth != 8 or interlace:
                sys.exit('Only 8-bit, non-interlaced PNGs are supported (re-export the screenshot).')
        elif kind == b'PLTE':
            palette = [tuple(body[i:i + 3]) for i in range(0, len(body), 3)]
        elif kind == b'IDAT':
            idat += body
        pos += 12 + length
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw, stride = zlib.decompress(idat), width * channels
    rows, prev, i = [], bytearray(stride), 0
    for _ in range(height):
        f, line = raw[i], bytearray(raw[i + 1:i + 1 + stride])
        i += 1 + stride
        for x in range(stride):
            a = line[x - channels] if x >= channels else 0
            b, c = prev[x], prev[x - channels] if x >= channels else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        if ctype == 3: rows.append([palette[v] for v in line])
        elif channels in (1, 2): rows.append([(line[x],) * 3 for x in range(0, stride, channels)])
        else: rows.append([tuple(line[x:x + 3]) for x in range(0, stride, channels)])
        prev = line
    return width, height, rows

def luminance(c):
    lin = [(v / 255) / 12.92 if v / 255 <= 0.04045 else ((v / 255 + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]

def contrast(a, b):
    hi, lo = sorted([luminance(a), luminance(b)], reverse=True)
    return (hi + 0.05) / (lo + 0.05)

def distance(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])

def close(a, b):
    return distance(a, b) <= TOLERANCE

def regions(px, w, h, minimum):
    """Flood-fill same-color regions; keep filled shapes big enough to be containers."""
    seen = bytearray(w * h)
    found = []
    for sy in range(0, h, 2):
        for sx in range(0, w, 2):
            if seen[sy * w + sx]:
                continue
            seed, stack, cells = px[sy][sx], [(sx, sy)], []
            seen[sy * w + sx] = 1
            while stack:
                x, y = stack.pop()
                cells.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and close(px[ny][nx], seed):
                        seen[ny * w + nx] = 1
                        stack.append((nx, ny))
            xs, ys = [c[0] for c in cells], [c[1] for c in cells]
            box = (min(xs), min(ys), max(xs), max(ys))
            bw, bh = box[2] - box[0] + 1, box[3] - box[1] + 1
            if bw >= minimum and bh >= minimum and len(cells) / (bw * bh) >= 0.55 and len(cells) < 0.97 * w * h:
                found.append((seed, box, set(cells)))
    return found

def clusters(columns, merge=6):
    out = []
    for x in sorted(columns):
        if out and x - out[-1][1] <= merge: out[-1][1] = x
        else: out.append([x, x])
    return out

def level(diff, size):
    return 'fail' if diff > max(6, size * 0.06) else 'warn' if diff > max(3, size * 0.03) else None

def level_y(diff, size):
    # Vertical ink centering depends on the font (caps, x-height, descenders), so only clear cases flag.
    return 'fail' if diff > max(10, size * 0.25) else 'warn' if diff > max(6, size * 0.15) else None

def dominant(px, cells):
    """The container's real fill: its most common color (the flood seed may be an anti-aliased edge)."""
    counts = {}
    for i, (x, y) in enumerate(cells):
        if i % 7: continue
        counts[px[y][x]] = counts.get(px[y][x], 0) + 1
    return max(counts, key=counts.get)

def analyse(px, seed, box, cells, scale, inner=()):
    """inner: boxes of containers nested inside this one; each counts as one solid item (its own
    contents and shadow halo are its business, not this container's ink)."""
    x0, y0, x1, y1 = box
    seed = dominant(px, cells)
    halo = [(bx - 3, by - 3, bx + bw + 2, by + bh + 2) for bx, by, bw, bh in inner]
    inside = lambda x, y: any(a <= x <= c and b <= y <= d for a, b, c, d in halo)
    ink, colors = [], {}
    for y in range(y0, y1 + 1):
        row = [x for x in range(x0, x1 + 1) if (x, y) in cells]
        if len(row) < 2: continue
        for x in range(row[0], row[-1] + 1):
            c = px[y][x]
            if (x, y) not in cells and not inside(x, y) and distance(c, seed) > INK_DELTA:
                ink.append((x, y))
                colors[c] = colors.get(c, 0) + 1
    solids = [(bx, by, bx + bw - 1, by + bh - 1) for bx, by, bw, bh in inner]
    if not ink and not solids: return None
    il = min([p[0] for p in ink] + [s[0] for s in solids])
    ir = max([p[0] for p in ink] + [s[2] for s in solids])
    # Vertical centering is judged on the dense band of the ink (x-height/caps), the part the eye centers;
    # ascenders, descenders and stray marks would otherwise skew it.
    per_row = {}
    for _, y in ink: per_row[y] = per_row.get(y, 0) + 1
    dense = [y for y, n in per_row.items() if n >= 0.25 * max(per_row.values())] if per_row else []
    bt = min(dense + [s[1] for s in solids]) if dense or solids else y0
    bb = max(dense + [s[3] for s in solids]) if dense or solids else y1
    left, right, top, bottom = il - x0, x1 - ir, bt - y0, y1 - bb
    main = max(sorted(colors.items(), key=lambda kv: -kv[1])[:6], key=lambda kv: abs(sum(kv[0]) - sum(seed)))[0] if colors else seed
    items = clusters({p[0] for p in ink} | {x for s in solids for x in range(s[0], s[2] + 1)})
    gaps = [b[0] - a[1] for a, b in zip(items, items[1:])]
    width, height = x1 - x0 + 1, y1 - y0 + 1
    h_level, v_level = level(abs(left - right), width), level_y(abs(top - bottom), height)
    return {
        'fill': '#%02x%02x%02x' % seed, 'box': [x0, y0, width, height], 'ink': [il, bt, ir - il + 1, bb - bt + 1],
        'gaps': {'left': left, 'right': right, 'top': top, 'bottom': bottom}, 'inkBand': [bt, bb],
        'offsetX': round((left - right) / 2 / scale, 1), 'offsetY': round((top - bottom) / 2 / scale, 1),
        'level': 'fail' if 'fail' in (h_level, v_level) else (h_level or v_level), 'levelX': h_level, 'levelY': v_level,
        'items': [[a, b] for a, b in items], 'itemGaps': gaps,
        'inkColor': '#%02x%02x%02x' % main, 'contrast': round(contrast(main, seed), 2),
    }

def mark_uneven_neighbours(found):
    """A nested container (e.g. a selected pill) that sits closer to one neighbour than the other is
    usually a mispositioned highlight rather than misaligned text."""
    for outer in found:
        items, gaps = outer['items'], outer['itemGaps']
        for inner in found:
            if inner is outer: continue
            bx, by, bw, bh = inner['box']
            ox, oy, ow, oh = outer['box']
            if not (ox <= bx and bx + bw <= ox + ow and oy <= by and by + bh <= oy + oh): continue
            for k in range(1, len(items) - 1):
                a, b = items[k]
                if abs(a - bx) <= 4 and abs(b - (bx + bw - 1)) <= 4:
                    left, right = gaps[k - 1], gaps[k]
                    if abs(left - right) > max(6, 0.2 * min(left, right)):
                        inner['neighbourGaps'] = [left, right]
                        inner['note'] = f"sits {abs(left - right) / 2:.0f}px closer to its {'right' if right < left else 'left'} neighbour ({left}px vs {right}px): likely a mispositioned highlight"

def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('image'); parser.add_argument('--crop'); parser.add_argument('--json', action='store_true')
    parser.add_argument('--scale', type=float, default=1.0); parser.add_argument('--min', type=int, default=16)
    args = parser.parse_args()
    w, h, px = read_png(args.image)
    if args.crop:
        cx, cy, cw, ch = (int(v) for v in args.crop.split(','))
        px, w, h = [row[cx:cx + cw] for row in px[cy:cy + ch]], cw, ch
    shapes = regions(px, w, h, args.min)
    def nested(box):
        x0, y0, x1, y1 = box
        return [(b[0], b[1], b[2] - b[0] + 1, b[3] - b[1] + 1) for _, b, _ in shapes
                if b != box and x0 <= b[0] and b[2] <= x1 and y0 <= b[1] and b[3] <= y1]
    found = [r for r in (analyse(px, seed, box, cells, args.scale, nested(box)) for seed, box, cells in shapes) if r]
    found.sort(key=lambda r: -r['box'][2] * r['box'][3])
    mark_uneven_neighbours(found)
    report = {'image': args.image, 'size': [w, h], 'scale': args.scale, 'containers': found}
    if args.json:
        print(json.dumps(report, indent=2)); return
    print(f"{args.image}: {w}×{h}px, scale {args.scale} (offsets in CSS px)")
    for n, c in enumerate(found, 1):
        g = c['gaps']
        flag = lambda lv: f"  <- {lv.upper()} SU-137" if lv else ''
        print(f"\n#{n} fill {c['fill']} box {c['box'][0]},{c['box'][1]} {c['box'][2]}×{c['box'][3]}  ink {c['inkColor']} contrast {c['contrast']}:1")
        print(f"   horizontal: left {g['left']}px, right {g['right']}px -> off-center {c['offsetX']:+}px{flag(c['levelX'])}")
        print(f"   vertical:   top {g['top']}px, bottom {g['bottom']}px (text core) -> off-center {c['offsetY']:+}px{flag(c['levelY'])}")
        if c.get('note'):
            print(f"   neighbours: {c['note']}")
        if len(c['items']) > 2:
            print(f"   items: {' | '.join(f'{a}–{b}' for a, b in c['items'])}; gaps {' · '.join(map(str, c['itemGaps']))}")

if __name__ == '__main__':
    main()
