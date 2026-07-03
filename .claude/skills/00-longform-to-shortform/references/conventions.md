# File Conventions

- **Renders:** `projects/{skill-name}/renders/YYYY-MM-DD-project-name/`
- **Run data:** `projects/{skill-name}/runs/YYYY-MM-DD-project-name/` (source, clips, logs)
- **Audio/SFX:** `projects/{skill-name}/audio/`
- **Logos:** `projects/{skill-name}/logos/`
- **FPS:** 30 | **Portrait:** 1080x1920 | **Landscape:** 1920x1080

## Output Directory

Pipeline outputs (videos, audio, logos, renders) go to `projects/{skill-name}/` following Agentic OS conventions.

```
projects/{skill-name}/
├── renders/YYYY-MM-DD-title/   <- FINAL OUTPUT — rendered clips
├── runs/YYYY-MM-DD-title/      <- pipeline working data (source, clips, logs)
├── audio/                      <- SFX and background music
└── logos/                      <- brand logos
```
