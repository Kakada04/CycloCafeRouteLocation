import os
import math
import shutil
import subprocess
import fitz
from PIL import Image
import anim_math as am

OUTPUT_DIR = "D:/CycloCafe/temp_frames"
OUTPUT_DIR_ALPHA = "D:/CycloCafe/temp_frames_alpha"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR_ALPHA, exist_ok=True)

FFMPEG_EXE = r"D:\TranslateMoviceVoice\tools\ffmpeg7\ffmpeg-7.1-essentials_build\bin\ffmpeg.exe"
ASSETS_DIR = r"D:\CycloCafe\assets\image\loading"
os.makedirs(ASSETS_DIR, exist_ok=True)

TOTAL_FRAMES = 96  # 3.2s at 30 fps
FPS = 30

# Pre-compute smooth curves
def make_c_points(x_serif, x_back, y_top, y_bot, steps=30):
    pts = [(x_serif, y_top), (x_back + 14, y_top)]
    cx = x_back + 14
    cy = (y_top + y_bot) / 2
    ry = (y_bot - y_top) / 2
    rx = 14
    for i in range(steps + 1):
        angle = math.pi/2 + math.pi * (i / steps)
        px = cx + rx * math.cos(angle)
        py = cy - ry * math.sin(angle)
        pts.append((px, py))
    pts.append((x_serif, y_bot))
    return pts

def make_o_points(cx, cy, rx, ry, steps=40):
    pts = []
    for i in range(steps + 1):
        angle = -math.pi/2 + 2 * math.pi * (i / steps)
        px = cx + rx * math.cos(angle)
        py = cy + ry * math.sin(angle)
        pts.append((px, py))
    return pts

def make_dome_points(x1, y_bot, x2, y_top, steps=30):
    pts = [(x1, y_bot), (x1, y_bot - 8)]
    cx = (x1 + x2) / 2
    rx = (x2 - x1) / 2
    ry = (y_bot - 8) - y_top
    for i in range(steps + 1):
        angle = math.pi - math.pi * (i / steps)
        px = cx + rx * math.cos(angle)
        py = (y_bot - 8) - ry * math.sin(angle)
        pts.append((px, py))
    pts.append((x2, y_bot))
    return pts

C1_PTS = make_c_points(306, 266, 242, 340)
C2_PTS = make_c_points(400, 360, 242, 340)
O_PTS = make_o_points(487, 291, 15, 49)
DOME_PTS = make_dome_points(286, 226, 362, 192)

REAR_STAY_PTS = am.sample_bezier((180, 252), (166, 270), (140, 300), (132, 340), 30)
SWOOP_PTS = am.sample_bezier((191, 285), (205, 305), (230, 338), (276, 340), 30)
SADDLE_PTS = [
    (148, 232), (150, 224), (165, 220), (185, 220), 
    (206, 222), (208, 226), (202, 233), (180, 240), 
    (160, 242), (148, 232)
]

def render_frame_svg(frame_idx, total_frames, is_transparent=False):
    t = frame_idx / (total_frames - 1)
    
    # Global fade out at the very end for smooth loop (last 8 frames)
    fade = 1.0
    if frame_idx >= total_frames - 8:
        fade = (total_frames - 1 - frame_idx) / 7.0

    svg_parts = []
    svg_parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">')
    if not is_transparent:
        svg_parts.append(f'<rect width="600" height="450" fill="#FFFFFF"/>')
    svg_parts.append(f'<g opacity="{fade:.3f}">')

    tips = []

    def add(item):
        svg, tip = item
        if svg:
            svg_parts.append(svg)
        if tip:
            tips.append(tip)

    # TIMELINE (Drawing finishes by t=0.68, hold from 0.68 to 0.90, fade from 0.90 to 1.00)
    
    # 1. REAR WHEEL: Center (132, 340), Radius 62
    add(am.draw_arc_circle(132, 340, 62, t, 0.00, 0.10, width=4.2))
    add(am.draw_point_circle(132, 340, 6, t, 0.08, 0.12))
    
    # 8 Spokes
    add(am.draw_line(132, 340, 194, 340, t, 0.09, 0.14, width=2.2))
    add(am.draw_line(132, 340, 70, 340, t, 0.09, 0.14, width=2.2))
    add(am.draw_line(132, 340, 132, 402, t, 0.10, 0.15, width=2.2))
    add(am.draw_line(132, 340, 132, 278, t, 0.10, 0.15, width=2.2))
    add(am.draw_line(132, 340, 176, 384, t, 0.11, 0.16, width=2.2))
    add(am.draw_line(132, 340, 88, 384, t, 0.11, 0.16, width=2.2))
    add(am.draw_line(132, 340, 88, 296, t, 0.11, 0.16, width=2.2))
    add(am.draw_line(132, 340, 176, 296, t, 0.11, 0.16, width=2.2))

    # 2. FRAME & SADDLE
    add(am.draw_smooth_curve(REAR_STAY_PTS, t, 0.12, 0.18, width=4.0))
    add(am.draw_line(180, 252, 202, 340, t, 0.13, 0.19, width=4.0))
    add(am.draw_line(178, 242, 180, 252, t, 0.15, 0.19, width=4.0))

    # Saddle
    add(am.draw_smooth_curve(SADDLE_PTS, t, 0.16, 0.22, width=2.0))
    add(am.draw_fade_element('<path d="M 148 232 C 150 224, 172 220, 206 222 C 210 223, 212 228, 204 233 C 190 240, 172 242, 154 242 C 148 242, 146 236, 148 232 Z" fill="#222224"/>', t, 0.20, 0.26))

    # 3. CHAINRING & PEDAL
    add(am.draw_arc_circle(202, 340, 15, t, 0.18, 0.24, width=2.2))
    add(am.draw_point_circle(202, 340, 3.5, t, 0.21, 0.25))
    add(am.draw_line(202, 325, 202, 355, t, 0.20, 0.25, width=2.0))
    add(am.draw_line(187, 340, 217, 340, t, 0.20, 0.25, width=2.0))
    add(am.draw_line(202, 340, 190, 362, t, 0.22, 0.27, width=3.2))
    add(am.draw_line(182, 362, 198, 362, t, 0.24, 0.29, width=4.0))

    # 4. FRAME CONNECTORS TO CART
    add(am.draw_line(194, 300, 280, 300, t, 0.25, 0.32, width=3.8))
    add(am.draw_smooth_curve(SWOOP_PTS, t, 0.26, 0.34, width=3.8))
    add(am.draw_line(132, 340, 520, 340, t, 0.28, 0.40, width=4.0))

    # 5. CART TYPOGRAPHY "CYCLO" AS LOWER FRAME
    # C (1st)
    add(am.draw_smooth_curve(C1_PTS, t, 0.32, 0.39, width=4.0))
    # Y
    y_arms = [(314, 242), (333, 282), (352, 242)]
    add(am.draw_smooth_curve(y_arms, t, 0.37, 0.43, width=4.0))
    add(am.draw_line(333, 282, 333, 340, t, 0.41, 0.47, width=4.0))
    # C (2nd)
    add(am.draw_smooth_curve(C2_PTS, t, 0.42, 0.49, width=4.0))
    # L
    l_path = [(426, 242), (426, 340), (450, 340)]
    add(am.draw_smooth_curve(l_path, t, 0.45, 0.51, width=4.0))
    # O
    add(am.draw_smooth_curve(O_PTS, t, 0.48, 0.55, width=4.0))

    # 6. FRONT WHEEL
    add(am.draw_arc_circle(400, 340, 62, t, 0.44, 0.54, width=4.2))
    add(am.draw_point_circle(400, 340, 6, t, 0.51, 0.55))
    # 8 Spokes
    add(am.draw_line(400, 340, 462, 340, t, 0.52, 0.57, width=2.2))
    add(am.draw_line(400, 340, 338, 340, t, 0.52, 0.57, width=2.2))
    add(am.draw_line(400, 340, 400, 278, t, 0.53, 0.58, width=2.2))
    add(am.draw_line(400, 340, 400, 402, t, 0.53, 0.58, width=2.2))
    add(am.draw_line(400, 340, 444, 296, t, 0.54, 0.59, width=2.2))
    add(am.draw_line(400, 340, 356, 384, t, 0.54, 0.59, width=2.2))
    add(am.draw_line(400, 340, 444, 384, t, 0.54, 0.59, width=2.2))
    add(am.draw_line(400, 340, 356, 296, t, 0.54, 0.59, width=2.2))

    # 7. COUNTER TABLE
    add(am.draw_line(278, 228, 520, 228, t, 0.50, 0.58, width=4.0))
    add(am.draw_line(278, 240, 520, 240, t, 0.51, 0.59, width=4.0))
    add(am.draw_line(278, 228, 278, 240, t, 0.57, 0.60, width=4.0))
    add(am.draw_line(520, 228, 520, 240, t, 0.58, 0.61, width=4.0))
    add(am.draw_line(520, 240, 550, 240, t, 0.59, 0.63, width=4.0))

    # 8. ITEMS ON COUNTER
    # Pastry Dome
    add(am.draw_smooth_curve(DOME_PTS, t, 0.54, 0.62, width=3.0))
    add(am.draw_line(288, 210, 360, 210, t, 0.59, 0.63, width=2.0))

    # Center Pitcher
    pitcher_path = [(376, 226), (376, 196), (398, 196), (398, 226)]
    add(am.draw_smooth_curve(pitcher_path, t, 0.57, 0.63, width=2.5))
    pitcher_handle = [(376, 202), (368, 202), (368, 214), (376, 214)]
    add(am.draw_smooth_curve(pitcher_handle, t, 0.60, 0.64, width=2.0))
    add(am.draw_point_circle(387, 208, 3.0, t, 0.61, 0.65))
    add(am.draw_line(387, 186, 387, 196, t, 0.60, 0.64, width=2.5))
    add(am.draw_line(382, 186, 392, 186, t, 0.61, 0.65, width=2.5))
    add(am.draw_fade_element('<rect x="402" y="208" width="6" height="18" rx="1" fill="#222224"/>', t, 0.62, 0.66))

    # Espresso Machine
    machine_body = [(432, 226), (432, 140), (486, 140), (486, 226)]
    add(am.draw_smooth_curve(machine_body, t, 0.58, 0.65, width=3.5))
    add(am.draw_line(430, 133, 488, 133, t, 0.62, 0.67, width=2.5))
    cup1 = am.sample_bezier((440, 133), (440, 127), (452, 127), (452, 133), 15)
    cup2 = am.sample_bezier((460, 133), (460, 127), (472, 127), (472, 133), 15)
    add(am.draw_smooth_curve(cup1, t, 0.64, 0.68, width=2.0))
    add(am.draw_smooth_curve(cup2, t, 0.65, 0.69, width=2.0))
    add(am.draw_line(432, 166, 486, 166, t, 0.63, 0.67, width=2.5))
    spout1 = [(442, 166), (448, 180), (458, 180), (462, 166)]
    add(am.draw_smooth_curve(spout1, t, 0.65, 0.69, width=2.5))
    add(am.draw_line(480, 172, 498, 194, t, 0.66, 0.70, width=4.0))
    add(am.draw_fade_element('<rect x="494" y="190" width="5" height="10" rx="1.5" transform="rotate(-40 496 195)" fill="#222224"/>', t, 0.68, 0.71))
    add(am.draw_line(460, 188, 460, 206, t, 0.66, 0.70, width=3.5))
    add(am.draw_line(432, 216, 486, 216, t, 0.67, 0.71, width=2.5))

    # 9. CANOPY SUPPORT POLES
    add(am.draw_line(280, 228, 280, 96, t, 0.63, 0.70, width=4.0))
    add(am.draw_line(486, 228, 486, 96, t, 0.64, 0.71, width=4.0))

    # 10. CANOPY AWNING SCALLOPS & BANNER
    scallops_code = '''<path d="
      M 240 96
      C 240 106, 264 106, 264 96
      C 264 106, 288 106, 288 96
      C 288 106, 312 106, 312 96
      C 312 106, 336 106, 336 96
      C 336 106, 360 106, 360 96
      C 360 106, 384 106, 384 96
      C 384 106, 408 106, 408 96
      C 408 106, 432 106, 432 96
      C 432 106, 456 106, 456 96
      C 456 106, 480 106, 480 96
      C 480 106, 504 106, 504 96
      C 504 106, 528 106, 528 96
      C 528 106, 552 106, 552 96
      Z" fill="#222224" stroke="#222224" stroke-width="1.5"/>'''
    add(am.draw_fade_element(scallops_code, t, 0.66, 0.72))

    # Black Banner Box
    p_banner = am.prog(t, 0.67, 0.73)
    if p_banner > 0:
        w_banner = 312 * p_banner
        svg_parts.append(f'<rect x="240" y="60" width="{w_banner:.1f}" height="36" fill="#222224" stroke="#222224" stroke-width="1.5"/>')

    # Brand Text "CYCLO Café"
    text_code = '<text x="396" y="87" text-anchor="middle" font-family="\'Montserrat\', \'Arial Black\', sans-serif" font-weight="700" font-size="28" fill="#FFFFFF" letter-spacing="3">CYCLO Café</text>'
    add(am.draw_fade_element(text_code, t, 0.70, 0.75))

    # 11. ACTIVE DRAWING STYLUS / PEN POINT (when lines are actively drawing)
    if tips and t < 0.72:
        last_tip = tips[-1]
        svg_parts.append(f'<circle cx="{last_tip[0]:.1f}" cy="{last_tip[1]:.1f}" r="4.5" fill="#18181B"/>')
        svg_parts.append(f'<circle cx="{last_tip[0]:.1f}" cy="{last_tip[1]:.1f}" r="8.0" fill="#18181B" opacity="0.25"/>')

    # 12. COFFEE STEAM ANIMATION (Active from t=0.72 to 1.0)
    if t >= 0.72:
        # Loop steam cycles
        cycle_t = ((t - 0.72) / 0.28) * 2.5
        phase1 = cycle_t % 1.0
        sy1 = 125 - phase1 * 26
        op1 = math.sin(phase1 * math.pi) * 0.75
        svg_parts.append(f'<path d="M 446 {sy1:.1f} Q 441 {sy1-9:.1f}, 447 {sy1-18:.1f} T 445 {sy1-28:.1f}" stroke="#71717A" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="{op1:.2f}"/>')
        
        phase2 = (cycle_t + 0.45) % 1.0
        sy2 = 125 - phase2 * 26
        op2 = math.sin(phase2 * math.pi) * 0.65
        svg_parts.append(f'<path d="M 466 {sy2:.1f} Q 471 {sy2-9:.1f}, 465 {sy2-18:.1f} T 467 {sy2-28:.1f}" stroke="#71717A" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="{op2:.2f}"/>')

    svg_parts.append('</g>')
    svg_parts.append('</svg>')

    return "".join(svg_parts)

print(f"Generating {TOTAL_FRAMES} frames...")
for i in range(TOTAL_FRAMES):
    # White background frames
    svg_str = render_frame_svg(i, TOTAL_FRAMES, is_transparent=False)
    doc = fitz.open(stream=svg_str.encode("utf-8"), filetype="svg")
    mat = fitz.Matrix(480 / 600, 360 / 450)
    pix = doc[0].get_pixmap(matrix=mat, alpha=False)
    frame_path = os.path.join(OUTPUT_DIR, f"frame_{i:04d}.png")
    pix.save(frame_path)

    # Transparent frames for alpha GIF
    svg_alpha = render_frame_svg(i, TOTAL_FRAMES, is_transparent=True)
    doc_a = fitz.open(stream=svg_alpha.encode("utf-8"), filetype="svg")
    pix_a = doc_a[0].get_pixmap(matrix=mat, alpha=True)
    frame_path_a = os.path.join(OUTPUT_DIR_ALPHA, f"frame_{i:04d}.png")
    pix_a.save(frame_path_a)

print("Frames finished. Rendering videos and GIFs with FFmpeg...")

mp4_path = os.path.join(ASSETS_DIR, "cyclo-loading.mp4")
webm_path = os.path.join(ASSETS_DIR, "cyclo-loading.webm")
gif_path = os.path.join(ASSETS_DIR, "cyclo-loading.gif")
gif_transparent_path = os.path.join(ASSETS_DIR, "cyclo-loading-transparent.gif")

# 1. Render MP4 (Crisp H.264, 480x360, 30fps)
cmd_mp4 = [
    FFMPEG_EXE, "-y",
    "-framerate", str(FPS),
    "-i", os.path.join(OUTPUT_DIR, "frame_%04d.png"),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-movflags", "+faststart",
    mp4_path
]
subprocess.run(cmd_mp4, check=True)
print("MP4 generated:", mp4_path)

# 2. Render WebM (Transparent capable, VP9, 30fps)
cmd_webm = [
    FFMPEG_EXE, "-y",
    "-framerate", str(FPS),
    "-i", os.path.join(OUTPUT_DIR_ALPHA, "frame_%04d.png"),
    "-c:v", "libvpx-vp9",
    "-pix_fmt", "yuva420p",
    "-crf", "26",
    "-b:v", "0",
    webm_path
]
subprocess.run(cmd_webm, check=True)
print("WebM generated:", webm_path)

# 3. Render High-Quality Small GIF (White background, 360x270, 25fps, 64-color palette)
cmd_gif = [
    FFMPEG_EXE, "-y",
    "-framerate", str(FPS),
    "-i", os.path.join(OUTPUT_DIR, "frame_%04d.png"),
    "-filter_complex", "[0:v] fps=25,scale=360:-1:flags=lanczos,split [a][b];[a] palettegen=max_colors=64:stats_mode=diff [p];[b][p] paletteuse=dither=bayer:bayer_scale=3",
    gif_path
]
subprocess.run(cmd_gif, check=True)
print("GIF generated:", gif_path)

# 4. Render Transparent GIF (360x270, 25fps, alpha palettegen)
cmd_gif_trans = [
    FFMPEG_EXE, "-y",
    "-framerate", str(FPS),
    "-i", os.path.join(OUTPUT_DIR_ALPHA, "frame_%04d.png"),
    "-filter_complex", "[0:v] fps=25,scale=360:-1:flags=lanczos,split [a][b];[a] palettegen=reserve_transparent=1:stats_mode=diff [p];[b][p] paletteuse=alpha_threshold=128",
    gif_transparent_path
]
subprocess.run(cmd_gif_trans, check=True)
print("Transparent GIF generated:", gif_transparent_path)

# Print Summary
print("--- Generation Summary ---")
print(f"MP4 size: {os.path.getsize(mp4_path) / 1024:.1f} KB")
print(f"WebM size: {os.path.getsize(webm_path) / 1024:.1f} KB")
print(f"GIF size: {os.path.getsize(gif_path) / 1024:.1f} KB")
print(f"Transparent GIF size: {os.path.getsize(gif_transparent_path) / 1024:.1f} KB")
