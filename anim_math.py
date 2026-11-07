import math

def clamp(v, min_v=0.0, max_v=1.0):
    return max(min_v, min(max_v, v))

def prog(t, t0, t1):
    if t <= t0:
        return 0.0
    if t >= t1:
        return 1.0
    p = (t - t0) / (t1 - t0)
    return p * p * (3 - 2 * p)

def draw_line(x1, y1, x2, y2, t, t0, t1, width=4, color="#222224"):
    p = prog(t, t0, t1)
    if p <= 0:
        return "", None
    cur_x = x1 + (x2 - x1) * p
    cur_y = y1 + (y2 - y1) * p
    tip = (cur_x, cur_y) if (0.01 < p < 0.99) else None
    svg = f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{cur_x:.1f}" y2="{cur_y:.1f}" stroke="{color}" stroke-width="{width}" stroke-linecap="round"/>\n'
    return svg, tip

def draw_arc_circle(cx, cy, r, t, t0, t1, width=4, color="#222224", start_deg=-90):
    p = prog(t, t0, t1)
    if p <= 0:
        return "", None
    if p >= 0.999:
        return f'<circle cx="{cx}" cy="{cy}" r="{r}" stroke="{color}" stroke-width="{width}" fill="none"/>\n', None
    
    a1 = math.radians(start_deg)
    a2 = math.radians(start_deg + p * 360)
    x1 = cx + r * math.cos(a1)
    y1 = cy + r * math.sin(a1)
    x2 = cx + r * math.cos(a2)
    y2 = cy + r * math.sin(a2)
    large_arc = 1 if p > 0.5 else 0
    tip = (x2, y2) if (0.01 < p < 0.99) else None
    svg = f'<path d="M {x1:.2f} {y1:.2f} A {r} {r} 0 {large_arc} 1 {x2:.2f} {y2:.2f}" stroke="{color}" stroke-width="{width}" stroke-linecap="round" fill="none"/>\n'
    return svg, tip

def draw_point_circle(cx, cy, r, t, t0, t1, color="#222224"):
    p = prog(t, t0, t1)
    if p <= 0:
        return "", None
    cur_r = r * p
    return f'<circle cx="{cx}" cy="{cy}" r="{cur_r:.2f}" fill="{color}"/>\n', None

def sample_bezier(p0, p1, p2, p3, steps=40):
    pts = []
    for i in range(steps + 1):
        u = i / steps
        u2 = u * u
        u3 = u2 * u
        mu = 1.0 - u
        mu2 = mu * mu
        mu3 = mu2 * mu
        x = mu3 * p0[0] + 3 * mu2 * u * p1[0] + 3 * mu * u2 * p2[0] + u3 * p3[0]
        y = mu3 * p0[1] + 3 * mu2 * u * p1[1] + 3 * mu * u2 * p2[1] + u3 * p3[1]
        pts.append((x, y))
    return pts

def draw_smooth_curve(pts, t, t0, t1, width=4, color="#222224"):
    p = prog(t, t0, t1)
    if p <= 0 or len(pts) < 2:
        return "", None
    
    lengths = []
    total = 0.0
    for i in range(len(pts) - 1):
        dx = pts[i+1][0] - pts[i][0]
        dy = pts[i+1][1] - pts[i][1]
        l = math.hypot(dx, dy)
        lengths.append(l)
        total += l
    
    if p >= 0.999:
        d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in pts)
        return f'<path d="{d}" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>\n', None

    target = p * total
    accum = 0.0
    cur_pts = [pts[0]]
    tip = None
    for i, l in enumerate(lengths):
        if accum + l >= target:
            remain = target - accum
            ratio = remain / l if l > 0 else 0
            x = pts[i][0] + (pts[i+1][0] - pts[i][0]) * ratio
            y = pts[i][1] + (pts[i+1][1] - pts[i][1]) * ratio
            cur_pts.append((x, y))
            tip = (x, y)
            break
        else:
            accum += l
            cur_pts.append(pts[i+1])
            
    d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in cur_pts)
    svg = f'<path d="{d}" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>\n'
    return svg, tip

def draw_fade_element(svg_code, t, t0, t1):
    p = prog(t, t0, t1)
    if p <= 0:
        return "", None
    if p >= 1.0:
        return svg_code + "\n", None
    return f'<g opacity="{p:.2f}">{svg_code}</g>\n', None
