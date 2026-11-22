import sys
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw
import numpy as np

# TOP

# 1: centerpiece
# 2: background
# 3: both
MODE = 2

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

alpha = arr[..., 3] > 0
arr = arr[:, ::-1, :3] * alpha[..., None]

# embedding
W = arr.shape[0]
H = arr.shape[1]
L = max(W, H)
B = int(L/7)
D = B+L
sx = (D-W)//2
sy = (D-H)//2

arr_emb = np.zeros((D, D, 3))
arr_emb[sx:sx+W, sy:sy+H] = arr
arr = arr_emb

def get_cent(K):
    grey = arr.sum(-1)/768
    # m = grey.sum() / np.count_nonzero(alpha)
    # r = np.zeros(grey.shape)
    # r = r + np.median(bw)

    bw = np.zeros(grey.shape, dtype=bool)
    #K = int(sys.argv[1])
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
    return bw

def get_bg(R):
    bound = np.ones((D, D))
    #R = float(sys.argv[2])
    for x in range(D):
        #xh = min(x, D-x-1)*9/D
        #m = min(9 - (x+1)*9/D, 1)
        for y in range(D):
            #yh = min(y, D-y-1)*9/D
            #m = min(xh, yh, 1)
            bound[x, y] = R #0.4 #*m
    return rng.random((D, D)) < bound

blank = np.ones((D, D, 3))
cw = blank * c_w
cr = blank * c_r
def toc(m):
    m = m[..., None]
    return (m * cw) + ((~m) * cr)

def main(mode):
    if mode==1:
        fn = 'fg'
    elif mode==2:
        fn = 'bg'
    else:
        fn = 'out'

    ret = np.zeros((D, D, 4))
    vw = ret[..., :3]
    end = ret[..., 3]
    end += 255

    args = sys.argv[1:]
    if mode>1:
        R = float(args[-1])
        rand = get_bg(R)
        vw[:] = toc(rand)
        fn += f'-r{R}'
    else:
        end *= alpha
    if mode%2:
        K = int(args[1])
        bw = get_cent(K)
        vw[:] = toc(bw)
        fn += f'-k{K}'

    ret = ret.astype(np.uint8)
    return fn, ret

# CONCLUDE

fn, arr = main(MODE)
im = Image.fromarray(arr)
im.save(f"save/{fn}.png")

