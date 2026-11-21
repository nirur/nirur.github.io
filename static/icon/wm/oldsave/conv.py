from PIL import Image, ImageDraw

with Image.open('main.jpg') as im:
    im.save('main.png')
