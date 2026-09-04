#!/usr/bin/env bash
# compare.sh -- turn results/raw-scores.csv + blind-key.txt into the verdict.
# Reports the between-arm gap AGAINST the scorer's own noise. If the gap does
# not clear the noise, it says NULL. That rule was written in PLAN.md before
# any arm ran.
set -euo pipefail
P5="$(cd "$(dirname "$0")" && pwd)"; cd "$P5/results"
python3 - <<'PY'
import csv, collections, statistics as st, os, re
rows=[r for r in csv.reader(open('raw-scores.csv')) if len(r)==3 and r[2] not in ('NA','')]
key={}
if os.path.exists('blind-key.txt'):
    for l in open('blind-key.txt'):
        m=re.match(r'(subject-\d+)\s*=\s*(\S+)',l.strip())
        if m: key[m.group(1)]=m.group(2)
by=collections.defaultdict(list)
for subj,rep,val in rows:
    by[key.get(subj,subj)].append(float(val))

LABEL={'floor':'floor (untouched placeholder)','A':'A  single role',
       'Aplus':'A+ single role + rubric','B':'B  generator | evaluator',
       'C':'C  planner | generator | evaluator'}
order=[k for k in ['floor','A','Aplus','B','C'] if k in by]+[k for k in by if k not in LABEL]

print(f"{'arm':<38} {'n':>2} {'mean':>6} {'spread':>7}  replicates")
print('-'*78)
spreads=[]
for k in order:
    v=by[k]; sp=max(v)-min(v); spreads.append(sp)
    print(f"{LABEL.get(k,k):<38} {len(v):>2} {st.mean(v):>6.2f} {sp:>7.2f}  {v}")

noise=max(spreads) if spreads else 0
print('-'*78)
print(f"scorer noise (largest within-subject spread): {noise:.2f}")
arms=[k for k in order if k!='floor']
if len(arms)>1:
    means={k:st.mean(by[k]) for k in arms}
    gap=max(means.values())-min(means.values())
    best=max(means,key=means.get); worst=min(means,key=means.get)
    print(f"largest between-arm gap: {gap:.2f}  ({LABEL.get(best,best)} over {LABEL.get(worst,worst)})")
    print()
    print("VERDICT:", "SIGNAL — gap exceeds scorer noise" if gap>noise
          else "NULL — gap does not clear scorer noise; report as null")
if 'floor' in by and arms:
    f=st.mean(by['floor'])
    print()
    print("above the untouched placeholder floor (%.2f):" % f)
    for k in arms:
        d=st.mean(by[k])-f
        print(f"  {LABEL.get(k,k):<38} {d:+.2f}  {'' if d>noise else '<- within scorer noise of doing nothing'}")
PY
