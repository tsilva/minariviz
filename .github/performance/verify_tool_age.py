"""Verify registry age and integrity for every locked CI-only browser package."""
from pathlib import Path
from datetime import datetime,timezone,timedelta
import json,re,sys,urllib.parse,urllib.request
root=Path(__file__).resolve().parent/'tools';lock=json.loads((root/'package-lock.json').read_text());result=[]
for key,entry in lock['packages'].items():
    if not key:continue
    assert key.startswith('node_modules/')
    name=key.removeprefix('node_modules/');version=entry['version']
    assert re.fullmatch(r'[0-9]+[.][0-9]+[.][0-9]+',version)
    assert entry['resolved'].startswith('https://registry.npmjs.org/'+name+'/-/')
    with urllib.request.urlopen('https://registry.npmjs.org/'+urllib.parse.quote(name,safe=''),timeout=30) as response:
        raw=response.read(25000001);assert len(raw)<=25000000;metadata=json.loads(raw)
    published=datetime.fromisoformat(metadata['time'][version].replace('Z','+00:00'))
    assert published<=datetime.now(timezone.utc)-timedelta(days=7),'Locked tool is younger than seven days'
    canonical=metadata['versions'][version]['dist'];assert canonical['integrity']==entry['integrity'] and canonical['tarball']==entry['resolved']
    result.append({'name':name,'version':version,'published':published.isoformat(),'integrityMatched':True})
Path(sys.argv[1]).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
