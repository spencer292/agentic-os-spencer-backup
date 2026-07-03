# Phase 5 — REVIEW (the human gate)

Park the finished clip where Roy can approve it. Nothing posts from here.

## Steps

1. Create a job folder under Review: `create_file` (folder mime) with
   `parentId = '3_Review' (1bsmtqczar7AstsKMC0U6edRbhPS30Z6L')`, title `{YYYY-MM-DD}_{job}`.
2. Upload the finished `clip.mp4` into that folder (`create_file`, base64, `video/mp4`).
3. **Contact sheet** (if `review.contact_sheet`): a 3×3 frame grid so Roy can judge at a glance
   without opening the video:
   ```bash
   ffmpeg -y -i clip.mp4 -vf "select='not(mod(n,{total/9}))',scale=180:-1,tile=3x3" \
     -frames:v 1 contact.png -v quiet
   ```
   Upload `contact.png` alongside the clip.
4. Write `review.txt` into the folder with a one-line summary:
   ```
   {job} — {path} path — {duration}s — {segment_count} cuts
   Source: {n videos, m photos}   Music: {track or none}
   Picked moments: {short reason per segment, from scores or transcript}
   To publish: drag clip.mp4 into 4_Approved/
   ```
5. Move the job's source out of the way: leave `2_processing/{job}/` intact for re-runs, but mark the
   Inbox job done — move the original Inbox subfolder's contents are left as-is (user clears Inbox), or
   per config, rename the Inbox job folder to `{job}__done`. **Do not delete user source.**
6. Log the Review folder URL to `run-log.md` and surface it to the user as a clickable link.

## Output to user
A short message per job: what was built, why those moments, and the Review folder link. Then stop —
approval is the user's move.
