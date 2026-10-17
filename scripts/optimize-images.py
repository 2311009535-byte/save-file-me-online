# Lossless runtime encodings; originals remain untouched.
from PIL import Image
from pathlib import Path
import hashlib,json,sys
root=Path('public');mapping=json.loads((root/'asset-rewrites.json').read_text()) if sys.argv[1:] else {};before=after=0
for folder in (sys.argv[1:] or ['wonder','escape','retry']):
 for p in (root/'assets'/folder).glob('*'):
  if p.suffix.lower() not in ['.png','.jpg'] or p.stat().st_size<500000:continue
  digest=hashlib.sha256(p.read_bytes()).hexdigest()[:12]
  target=root/'assets'/'optimized'/folder/(p.name+'.'+digest+'.webp');target.parent.mkdir(parents=True,exist_ok=True)
  im=Image.open(p).convert('RGBA' if 'A' in Image.open(p).getbands() else 'RGB');im.save(target,'WEBP',lossless=True,method=4,exact=True)
  check=Image.open(target).convert(im.mode);assert check.size==im.size and check.tobytes()==im.tobytes()
  if target.stat().st_size<p.stat().st_size*.85:
   mapping['/'+str(p.relative_to(root))]='/'+str(target.relative_to(root));before+=p.stat().st_size;after+=target.stat().st_size
  else:target.unlink()
(root/'asset-rewrites.json').write_text(json.dumps(mapping,indent=2)+'\n')
(root/'_redirects').write_text(''.join(f'{src} {dest} 200!\n' for src,dest in mapping.items()))
print(f'{len(mapping)} lossless rewrites: {before/1048576:.1f} MiB -> {after/1048576:.1f} MiB ({(1-after/before)*100:.0f}% smaller)')
