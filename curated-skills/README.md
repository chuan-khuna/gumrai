# Curated skills

This folder holds the agent skills that live in this repo instead of being installed from a GitHub repo. Some are copied from other sources and some are written for this project. Install them all with one command from the repo root:

```sh
npx skills add ./curated-skills
```

Each skill is a folder under `skills/` with a `SKILL.md`. The skills CLI copies it into `.agents/skills/` and `.claude/skills/`, and records its hash in `skills-lock.json`.

## Skills

| Skill | Source | Use |
| --- | --- | --- |
| `technical-writing` | [cursor/plugins](https://github.com/cursor/plugins/tree/d73344bee8cf22e53b9d5f4cf5749d38ba38c174/pstack/skills/technical-writing), `pstack/skills/`, commit `d73344b`, unchanged | `/technical-writing`: write or review docs, PR descriptions, and commit messages |
| `unslop` | [cursor/plugins](https://github.com/cursor/plugins/tree/d73344bee8cf22e53b9d5f4cf5749d38ba38c174/pstack/skills/unslop), `pstack/skills/`, commit `d73344b`, unchanged | `/unslop`: remove AI writing patterns. `technical-writing` applies it to every document. |

Both skills set `disable-model-invocation: true`, so an agent runs them only when you type the slash command.

## Add or update a skill

1. Read every file of a skill before you copy it in. A skill is instructions that an agent follows.
2. Put it in `skills/<name>/`, with all of its files.
3. Add a row to the table above. For a copied skill, give the source repo, the path, and the commit. For a skill written here, write "this repo".
4. Run `npx skills add ./curated-skills`, and commit the skill, the installed copies, and `skills-lock.json` together.

To update a copied skill, copy the new version over the old one, change the commit in its row, and run step 4.
