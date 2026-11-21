import sys
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw
import numpy as np

# TOP

rng = np.random.default_rng(12250) # or 1337, or 8

c_w = (255, 255, 240)
c_r = (191, 33, 30) # (221, 64, 58)

with Image.open('base.png') as im:
    arr = np.asarray(im, dtype=float)

# HELPER

def stats(h):
    fix, ax = plt.subplots()
    ax.hist(h.flatten(), bins=120)
    plt.show()
    exit()

# MAIN

arr = arr[:, ::-1]

#size of embedding
W = arr.shape[0]
H = arr.shape[1]
L = max(W, H)
B = int(L/7)
D = B+L
sx = (D-W)//2
sy = (D-H)//2

arr_emb = np.zeros((D, D, 4))
arr_emb[sx:sx+W, sy:sy+H] = arr
arr = arr_emb

grey = arr.sum(-1)/768
full = arr[..., 3] > 0
#m = (grey * full).sum() / np.count_nonzero(full)
# r = np.zeros(grey.shape)
# r = r + np.median(bw)

bw = np.zeros(grey.shape, dtype=bool)
K = int(sys.argv[1])
for i in range(D):
    bb1 = max(i-K, 0)
    bb2 = min(i+K, D-1)
    for j in range(D):
        bb3 = max(j-K, 0)
        bb4 = min(j+K, D-1)
        s = grey[bb1:bb2, bb3:bb4]
        #m = np.median(s)
        m = s.mean()
        #v = 0 # r[i, j]
        bw[i, j] = (grey[i, j] >= m)

#stats(bw)

bound = np.ones((D, D))
R = float(sys.argv[2])
for x in range(D):
    #xh = min(x, D-x-1)*9/D
    #m = min(9 - (x+1)*9/D, 1)
    for y in range(D):
        #yh = min(y, D-y-1)*9/D
        #m = min(xh, yh, 1)
        bound[x, y] = R #0.4 #*m
rand = rng.random((D, D)) < bound

#on = (bw & full) ^ rand
on = (full & bw) | (~full & rand)
on = on[..., None]

blank = np.ones((D, D, 3))
cw = blank * c_w
cr = blank * c_r
arr = on * cw + (~on) * cr

# SHOW

arr = arr.astype(np.uint8)
im = Image.fromarray(arr)
im.save(f"save/out-r{R}-k{K}.png")

