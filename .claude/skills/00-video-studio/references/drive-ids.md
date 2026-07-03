# Cached Drive IDs — 31_Studio

Captured 2026-06-14. Re-resolve with a `search_files` query if any upload/download 404s.

| Folder | ID |
|--------|----|
| `31_Studio` (root) | `1MDe37YAwMi-MQExwL8qRekF1R0909Fi5` |
| `1_inbox` | `1IIq28oUi4rMsuUj-kh3vTgjNGuOSsuLN` |
| `2_processing` | `114zln_cGvwUZPQYuobxBncrXaxPY4L30` |
| `3_Review` | `1bsmtqczar7AstsKMC0U6edRbhPS30Z6L` |
| `4_Approved` | `1ERx8qZhFaQ7-3-gJrlXTc8Wc-Uc1edIL` |
| `5_Posted` | `1REPZquKlaBCa7KR4kDW2seD9_USjKmr_` |
| `6_Assets` | `1ve0phwjq-TRZfpHE7NOnGkLI7AsvD4ty` |

Shared Drive root: `0AKfRjuIGt6z3Uk9PVA`

## Resolve a job folder
```
search_files: parentId = '1IIq28oUi4rMsuUj-kh3vTgjNGuOSsuLN'
```
Each child folder is one job. List its files with `parentId = '{job_id}'`.
