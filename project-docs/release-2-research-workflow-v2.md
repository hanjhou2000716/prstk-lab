# Release 2 — Research workflow hardening

This increment keeps research work local-first and adds the fields needed to revisit a decision with evidence.

## Included

- Typed `ResearchProject` and draft models shared by the workbench and optional sync layer.
- Backward-compatible migration for existing `prstk-lab-workbench-v1` records.
- Structured workbench fields for original sources, methodology, assumptions, invalidation conditions, and post-review notes.
- JSON, Markdown, and CSV exports retain the new fields.
- Supabase sync normalises remote payloads before replacing local projects.
- Tool detail drawer explains a recommendation when it is driven by a pin, favorite, recent use, editorial selection, verification, or scenario.

## Safety boundaries

The homepage remains a four-card, one-screen portal. No dashboard, comparison mode, or additional homepage metadata was added. Cloud sync remains opt-in and requires the existing Supabase environment variables; local research remains usable without an account.
