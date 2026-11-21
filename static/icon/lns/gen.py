import math
from PIL import Image, ImageDraw
import random

random.seed(12250) # or 1337, or 8

S = 400
c_ow = (255, 255, 240)
c_r = (221, 64, 58)
img = Image.new('RGB', (S, S), c_r)
d = ImageDraw.Draw(img)
kwargs = {
    'fill': c_ow,
    'width': 1
}

def circle():
    L = 10
    N = 40
    sc = 1/6
    R = S*2/3
    mx = int(L*N)
    pts = [random.gauss(1/3, 1/6*sc) for _ in range(mx)]
    pts = [(math.tau*i/N, S*dr) for i,dr in enumerate(pts)]
    pts = [(S/2 + r*math.cos(theta), S/2 + r*math.sin(theta)) for theta,r in pts]
    d.line(pts + [pts[-1]], **kwargs)

def brow():
    w = 3/4
    N = 400
    pts = []
    l = lambda v: S/2 + S/2 * v
    for i in range(N+1):
        x = -w + (2*w)*i/N
        y = -x**4 + x**2
        y += random.gauss(0, 0.05)
        x = x*(.5+max(y,0)**0.2)
        x, y = math.log(abs(x)+1)*x/(abs(x)+1e-7), -1.1*y
        pts.append((l(x), l(y)))
    d.line(pts, **kwargs)

brow()
img.save('main.png')

