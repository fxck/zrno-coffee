<!-- #ZEROPS_EXTRACT_START:intro# -->
The **dev + stage pair**. `appdev` builds from git once and then idles so a
coding agent (Zerops Control Panel / Claude Code) can SSHFS-mount it and run the
dev server interactively; `appstage` runs the real production build so you can
verify what ships. Both share one PostgreSQL, object storage, Meilisearch and
Mailpit. Runs on the **Lightweight** plan. Pick this to develop or hack on ZRNO.
<!-- #ZEROPS_EXTRACT_END:intro# -->
