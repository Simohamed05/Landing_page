import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Circle, Rectangle, Wedge, FancyArrowPatch
import numpy as np
from matplotlib.animation import FuncAnimation, FFMpegWriter, PillowWriter
import os
import warnings
from PIL import Image, ImageDraw, ImageFont
import cv2

warnings.filterwarnings('ignore')

# Couleurs VentesPro
BG = '#f6f8fc'
INK = '#0b1633'
MUTED = '#6b7a94'
BLUE = '#2c5bff'
PURPLE = '#7c3aed'
PINK = '#ec4899'
GREEN = '#16a34a'
RED = '#ef4444'
WHITE = '#ffffff'

class VentesProReel:
    def __init__(self):
        self.width = 1080
        self.height = 1920  # Format 9:16 vertical (Reels/TikTok)
        self.fps = 30
        
    def create_gradient_bg(self, color1, color2, direction='vertical'):
        """Crée un dégradé de fond"""
        gradient = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        for i in range(self.height):
            ratio = i / self.height if direction == 'vertical' else 0.5
            r = int(int(color1[1:3], 16) * (1-ratio) + int(color2[1:3], 16) * ratio)
            g = int(int(color1[3:5], 16) * (1-ratio) + int(color2[3:5], 16) * ratio)
            b = int(int(color1[5:7], 16) * (1-ratio) + int(color2[5:7], 16) * ratio)
            gradient[i, :] = [r, g, b]
        return gradient
    
    # REMPLACER la méthode add_text_overlay :

    def add_text_overlay(self, img, text, y_pos, size=80, color=WHITE, bold=True, align='center'):
        """Ajoute du texte sur l'image"""
        draw = ImageDraw.Draw(img)
        # Utilisation police par défaut si Arial pas dispo
        try:
            font = ImageFont.truetype("arialbd.ttf" if bold else "arial.ttf", size)
        except:
            try:
                font = ImageFont.truetype("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf", size)
            except:
                font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        
        if align == 'center':
            x = (self.width - text_width) // 2
        elif align == 'left':
            x = 140  # Marge gauche fixe
        else:
            x = self.width - text_width - 80
            
        draw.text((x, y_pos), text, fill=color, font=font)
        return img
    def add_glass_card(self, img, x, y, w, h, alpha=180):
        """Ajoute une carte glassmorphism"""
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # Fond blanc semi-transparent
        draw.rounded_rectangle([x, y, x+w, y+h], radius=30, 
                              fill=(255, 255, 255, alpha), 
                              outline=(255, 255, 255, 220), width=2)
        
        img = Image.alpha_composite(img.convert('RGBA'), overlay)
        return img.convert('RGB')
    
    # REMPLACER la méthode scene_hook complète par celle-ci :

    def scene_hook(self, frame, total_frames):
        """Hook accrocheur - Problème"""
        progress = frame / total_frames
        
        # Fond dégradé bleu foncé
        img = Image.new('RGB', (self.width, self.height), INK)
        draw = ImageDraw.Draw(img)
        
        # Cercles décoratifs animés
        for i in range(3):
            offset = int(np.sin(frame * 0.1 + i) * 50)
            x = self.width // 2 + offset
            y = 400 + i * 200
            r = 100 + i * 50
            alpha = int(30 * (1 - progress))
            # Correction: couleur RGB valide
            blue_rgb = (44, 91, 255)  # BLUE en RGB
            draw.ellipse([x-r, y-r, x+r, y+r], fill=blue_rgb)
        
        # Texte principal avec effet machine à écrire
        text = "VOS DONNÉES DE VENTES"
        if progress > 0.1:
            chars = int(len(text) * min(1, (progress - 0.1) * 3))
            display_text = text[:chars]
            img = self.add_text_overlay(img, display_text, 600, 90, WHITE, True)
        
        # Sous-texte
        if progress > 0.4:
            sub_text = "sont inexploitées ?"
            img = self.add_text_overlay(img, sub_text, 720, 70, MUTED, False)
        
        # Emoji/Icon
        if progress > 0.6:
            img = self.add_text_overlay(img, "📉", 850, 120, WHITE, True)
        
        # Indicateur de scroll
        if progress > 0.8:
            bounce = int(abs(np.sin(frame * 0.2)) * 20)
            img = self.add_text_overlay(img, "↓", 1700 + bounce, 60, WHITE, True)
        
        return np.array(img)
    
    # REMPLACER la méthode scene_problem_detail complète :

    def scene_problem_detail(self, frame, total_frames):
        """Détail du problème"""
        progress = frame / total_frames
        
        # Fond
        img = Image.new('RGB', (self.width, self.height), BG)
        
        # Cards qui apparaissent
        problems = [
            ("📊", "Excel interminable", "Des heures à analyser", 400),
            ("😰", "Erreurs humaines", "Formules complexes", 750),
            ("💸", "Perte d'argent", "Décisions sans data", 1100),
        ]
        
        for i, (icon, title, desc, y) in enumerate(problems):
            delay = i * 0.15
            if progress > delay:
                card_prog = min(1, (progress - delay) * 2)
                
                # Animation slide up
                y_offset = int((1 - card_prog) * 100)
                
                # Glass card
                img = self.add_glass_card(img, 80, y - y_offset, 920, 280, 200)
                
                # Icon
                img = self.add_text_overlay(img, icon, y - y_offset + 40, 80, INK, True, 'left')
                
                # Title - CORRECTION: enlever le 140 en trop
                img = self.add_text_overlay(img, title, y - y_offset + 140, 60, INK, True, 'left')
                
                # Desc - CORRECTION: enlever le 140 en trop  
                img = self.add_text_overlay(img, desc, y - y_offset + 220, 45, MUTED, False, 'left')
        
        return np.array(img)
    
    def scene_solution_reveal(self, frame, total_frames):
        """Révélation de la solution"""
        progress = frame / total_frames
        
        # Fond avec dégradé animé
        bg_color = self.lerp_color(INK, BLUE, min(1, progress * 2))
        img = Image.new('RGB', (self.width, self.height), bg_color)
        
        # Logo qui apparaît
        if progress > 0.2:
            logo_scale = min(1, (progress - 0.2) * 2)
            logo_size = int(200 * logo_scale)
            
            # Cercle logo
            overlay = Image.new('RGBA', (self.width, self.height), (0,0,0,0))
            draw = ImageDraw.Draw(overlay)
            center_x, center_y = self.width//2, 500
            
            # Glow
            glow_r = int(150 * logo_scale)
            draw.ellipse([center_x-glow_r, center_y-glow_r, 
                         center_x+glow_r, center_y+glow_r], 
                        fill=(44, 91, 255, 100))
            
            # Cercle principal
            r = int(100 * logo_scale)
            draw.ellipse([center_x-r, center_y-r, center_x+r, center_y+r], 
                        fill=(44, 91, 255, 255))
            
            img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
            
            # VP text
            img = self.add_text_overlay(img, "VP", center_y - 40, int(80 * logo_scale), WHITE, True)
        
        # Nom qui slide in
        if progress > 0.4:
            x_offset = int((1 - min(1, (progress - 0.4) * 2)) * 200)
            img = self.add_text_overlay(img, "VentesPro", 700 - x_offset, 100, WHITE, True)
        
        # Tagline
        if progress > 0.6:
            img = self.add_text_overlay(img, "L'IA qui prédit vos ventes", 850, 60, WHITE, False)
        
        # Features rapides
        if progress > 0.8:
            features = ["🔮 Prévisions", "📈 Analytics", "🚨 Alertes"]
            for i, feat in enumerate(features):
                x = 200 + i * 300
                img = self.add_text_overlay(img, feat, 1100, 50, WHITE, False)
        
        return np.array(img)
    
    def scene_demo_dashboard(self, frame, total_frames):
        """Démo du dashboard"""
        progress = frame / total_frames
        
        img = Image.new('RGB', (self.width, self.height), BG)
        
        # Titre
        img = self.add_text_overlay(img, "Votre Dashboard IA", 100, 70, INK, True)
        
        # Zone graphique
        graph_y = 250
        
        # Fond graph
        img = self.add_glass_card(img, 50, graph_y, 980, 800, 230)
        
        # Génération données
        np.random.seed(42)
        dates = np.linspace(100, 980, 50)
        
        # Historique (partie gauche)
        hist_data = 400 + np.cumsum(np.random.randn(25) * 10)
        
        # Prévision (partie droite)
        forecast_data = np.concatenate([hist_data, hist_data[-1] + np.cumsum(np.random.randn(25) * 5)])
        
        # Animation progressive
        current_idx = int(50 * min(1, progress * 1.5))
        
        if current_idx > 1:
            draw = ImageDraw.Draw(img)
            
            # Tracer historique
            for i in range(min(current_idx, 25) - 1):
                x1 = int(dates[i]) + 50
                y1 = int(graph_y + 400 - hist_data[i] * 0.3)
                x2 = int(dates[i+1]) + 50
                y2 = int(graph_y + 400 - hist_data[i+1] * 0.3)
                draw.line([(x1, y1), (x2, y2)], fill=BLUE, width=4)
            
            # Tracer prévision
            if current_idx > 25:
                for i in range(24, min(current_idx, 49)):
                    x1 = int(dates[i]) + 50
                    y1 = int(graph_y + 400 - forecast_data[i] * 0.3)
                    x2 = int(dates[i+1]) + 50
                    y2 = int(graph_y + 400 - forecast_data[i+1] * 0.3)
                    draw.line([(x1, y1), (x2, y2)], fill=PURPLE, width=4)
                
                # Zone de confiance
                if progress > 0.7:
                    upper = forecast_data[24:current_idx] + 30
                    lower = forecast_data[24:current_idx] - 30
                    points = []
                    for i, val in enumerate(upper):
                        x = int(dates[24+i]) + 50
                        y = int(graph_y + 400 - val * 0.3)
                        points.append((x, y))
                    for i, val in enumerate(reversed(lower)):
                        x = int(dates[current_idx-1-i]) + 50
                        y = int(graph_y + 400 - val * 0.3)
                        points.append((x, y))
                    if len(points) > 2:
                        draw.polygon(points, fill=(124, 58, 237, 50))
        
        # Ligne "aujourd'hui"
        if progress > 0.6:
            x_today = 50 + int(dates[24])
            draw.line([(x_today, graph_y + 50), (x_today, graph_y + 750)], 
                     fill=PINK, width=3)
            # REMPLACER aussi (vers ligne 290) :

            img = self.add_text_overlay(img, "Aujourd'hui", 350, 35, PINK, True, 'left')
        
        # KPIs en bas
        # REMPLACER la section KPIs dans scene_demo_dashboard (vers la ligne 295) :

        # KPIs en bas
        if progress > 0.8:
            kpis = [("📈 +12%", "Croissance"), ("🎯 95%", "Précision"), ("⚡ -8%", "Risque")]
            for i, (val, label) in enumerate(kpis):
                x = 120 + i * 320
                img = self.add_glass_card(img, x, 1100, 280, 180, 200)
                img = self.add_text_overlay(img, val, 1150, 50, INK, True, 'left')
                img = self.add_text_overlay(img, label, 1220, 35, MUTED, False, 'left')
        
        return np.array(img)
    
    def scene_features_grid(self, frame, total_frames):
        """Grille des fonctionnalités"""
        progress = frame / total_frames
        
        img = Image.new('RGB', (self.width, self.height), BG)
        img = self.add_text_overlay(img, "Ce que vous obtenez", 80, 70, INK, True)
        
        features = [
            ("📥", "Import auto", "CSV/Excel", BLUE, 300),
            ("🤖", "IA Prédictive", "Prophet/ARIMA", PURPLE, 650),
            ("🚨", "Alertes", "Temps réel", PINK, 1000),
            ("📊", "Rapports", "PDF/Excel", BLUE, 1350),
        ]
        
        for i, (icon, title, desc, color, y) in enumerate(features):
            delay = 0.1 + i * 0.12
            if progress > delay:
                card_prog = min(1, (progress - delay) * 2)
                
                # Slide from side
                x_offset = int((1 - card_prog) * (200 if i % 2 == 0 else -200))
                x = 100 + (i % 2) * 500 + x_offset
                
                # Card avec couleur accent
                overlay = Image.new('RGBA', (self.width, self.height), (0,0,0,0))
                draw = ImageDraw.Draw(overlay)
                
                # Bordure colorée
                rgb = tuple(int(color[j:j+2], 16) for j in (1, 3, 5))
                draw.rounded_rectangle([x, y, x+420, y+280], radius=25,
                                      fill=(255,255,255,230), outline=rgb+(200,), width=3)
                
                img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
                
                # Contenu
                img = self.add_text_overlay(img, icon, y + 40, 70, INK, True, 'left')
                img = self.add_text_overlay(img, icon, x + 40, y + 40, 70, INK, True)
                img = self.add_text_overlay(img, title, x + 40, y + 140, 50, INK, True, 'left')
                img = self.add_text_overlay(img, desc, x + 40, y + 210, 35, MUTED, False, 'left')
        
        return np.array(img)
    
    def scene_social_proof(self, frame, total_frames):
        """Preuve sociale / témoignages"""
        progress = frame / total_frames
        
        # Fond dégradé
        img = Image.new('RGB', (self.width, self.height), BLUE)
        
        img = self.add_text_overlay(img, "Ils utilisent VentesPro", 150, 70, WHITE, True)
        
        # Stats animées
        stats = [
            ("+500", "Entreprises"),
            ("+2M", "Prévisions"),
            ("99%", "Satisfaction"),
        ]
        
        for i, (val, label) in enumerate(stats):
            if progress > 0.2 + i * 0.15:
                # Animation compteur
                target = int(val[1:]) if val[1:].isdigit() else 99
                current = int(target * min(1, (progress - 0.2 - i*0.15) * 2))
                display = val[0] + str(current) + (val[-1] if not val[-1].isdigit() else "")
                
                y = 450 + i * 350
                
                # Card
                img = self.add_glass_card(img, 150, y, 780, 280, 180)
                
                img = self.add_text_overlay(img, display, y + 60, 90, WHITE, True, 'left')
                img = self.add_text_overlay(img, display, 220, y + 60, 90, WHITE, True)
                img = self.add_text_overlay(img, label, 220, y + 170, 50, WHITE, False, 'left')
        
        return np.array(img)
    
    # REMPLACER cette méthode :

    def scene_cta_final(self, frame, total_frames):
        """CTA final"""
        progress = frame / total_frames
        
        # Fond avec pulse
        pulse = 1 + np.sin(frame * 0.1) * 0.05
        bg = Image.new('RGB', (self.width, self.height), BG)
        
        # Cercles pulsants
        draw = ImageDraw.Draw(bg)
        for r in [300, 400, 500]:
            alpha = int(20 * pulse * (1 - (r-300)/200))
            # Correction: RGB valide
            blue_tint = (200, 220, 255)  # Bleu très clair
            draw.ellipse([self.width//2 - r, 400 - r, 
                         self.width//2 + r, 400 + r],
                        fill=blue_tint)
        
        img = bg
        
        # Logo
        if progress > 0.1:
            overlay = Image.new('RGBA', (self.width, self.height), (0,0,0,0))
            draw = ImageDraw.Draw(overlay)
            draw.ellipse([self.width//2 - 120, 280, self.width//2 + 120, 520], 
                        fill=(44, 91, 255, 255))
            img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
            img = self.add_text_overlay(img, "VP", 360, 100, WHITE, True)
        
        # Texte
        if progress > 0.3:
            img = self.add_text_overlay(img, "Prêt à prédire", 600, 80, INK, True)
            img = self.add_text_overlay(img, "vos ventes ?", 700, 80, BLUE, True)
        
        # Bouton CTA
        if progress > 0.5:
            btn_pulse = 1 + np.sin(frame * 0.15) * 0.03
            btn_w = int(600 * btn_pulse)
            btn_h = int(120 * btn_pulse)
            btn_x = (self.width - btn_w) // 2
            btn_y = 900
            
            overlay = Image.new('RGBA', (self.width, self.height), (0,0,0,0))
            draw = ImageDraw.Draw(overlay)
            draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h],
                                  radius=60, fill=(44, 91, 255, 255))
            img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
            
            img = self.add_text_overlay(img, "🚀 Démo gratuite", btn_y + 35, 50, WHITE, True)
        
        # URL
        if progress > 0.7:
            img = self.add_text_overlay(img, "ventespro.streamlit.app", 1150, 45, PURPLE, True)
        
        # Urgence
        if progress > 0.85:
            img = self.add_text_overlay(img, "⚡ Offre limitée", 1300, 40, RED, True)
        
        return np.array(img)
    
    def lerp_color(self, c1, c2, t):
        """Interpolation entre deux couleurs hex"""
        r1, g1, b1 = int(c1[1:3], 16), int(c1[3:5], 16), int(c1[5:7], 16)
        r2, g2, b2 = int(c2[1:3], 16), int(c2[3:5], 16), int(c2[5:7], 16)
        r = int(r1 + (r2 - r1) * t)
        g = int(g1 + (g2 - g1) * t)
        b = int(b1 + (b2 - b1) * t)
        return f'#{r:02x}{g:02x}{b:02x}'
    
    def generate(self, output_path='VentesPro_Reel.mp4'):
        """Génère la vidéo complète"""
        print("🎬 Génération du Reel VentesPro...")
        print(f"   Format: {self.width}x{self.height} (9:16)")
        
        scenes = [
            (self.scene_hook, 3),           # Hook accrocheur
            (self.scene_problem_detail, 4), # Problème détaillé
            (self.scene_solution_reveal, 4), # Révélation solution
            (self.scene_demo_dashboard, 5),  # Démo dashboard
            (self.scene_features_grid, 4),   # Features
            (self.scene_social_proof, 4),    # Preuve sociale
            (self.scene_cta_final, 4),       # CTA
        ]
        
        all_frames = []
        
        for scene_func, duration in scenes:
            name = scene_func.__name__.replace('scene_', '')
            print(f"  📍 {name} ({duration}s)...")
            
            n_frames = duration * self.fps
            for f in range(n_frames):
                frame = scene_func(f, n_frames)
                all_frames.append(frame)
            print(f"     ✓ {n_frames} frames")
        
        print(f"✅ Total: {len(all_frames)} frames")
        
        # Export avec OpenCV (plus fiable)
        try:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, self.fps, 
                                 (self.width, self.height))
            
            for i, frame in enumerate(all_frames):
                # RGB to BGR pour OpenCV
                frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                out.write(frame_bgr)
                if i % 50 == 0:
                    print(f"   Export: {i}/{len(all_frames)}", end='\r')
            
            out.release()
            print(f"\n🎉 Vidéo sauvegardée: {output_path}")
            print(f"   ⏱️  Durée: {len(all_frames)/self.fps:.1f}s")
            
            # Sauvegarde aussi en GIF pour preview
            gif_path = output_path.replace('.mp4', '.gif')
            print(f"   🎞️  Création du GIF preview...")
            
            # Réduire pour GIF
            gif_frames = [Image.fromarray(f).resize((540, 960)) 
                         for f in all_frames[::3]]  # 10 fps
            
            gif_frames[0].save(
                gif_path, save_all=True, append_images=gif_frames[1:],
                duration=100, loop=0, optimize=True
            )
            print(f"   ✅ GIF: {gif_path}")
            
        except Exception as e:
            print(f"❌ Erreur: {e}")
            # Fallback images
            for i in range(0, len(all_frames), 30):
                img = Image.fromarray(all_frames[i])
                img.save(f'frame_{i:03d}.png')
            print("   🖼️  Images sauvegardées")
        
        return output_path

# Exécution
if __name__ == "__main__":
    reel = VentesProReel()
    reel.generate()