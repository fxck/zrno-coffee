<!-- #ZEROPS_EXTRACT_START:intro# -->
A **production-ready** setup tuned for moderate throughput: the app scales 1–2
containers on shared CPU behind health-gated rolling deploys (zero downtime),
while PostgreSQL, object storage, Meilisearch and Mailpit stay single-instance
with snapshot backups. Cheaper than the HA topology — pick this to run ZRNO in
production without the 3-node database and dedicated-CPU overhead.
<!-- #ZEROPS_EXTRACT_END:intro# -->
