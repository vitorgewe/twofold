---
type: review-summary
milestone: "[[M5-delivery]]"
findings: 6
agreed: 3
disagreed: 3
tags: [review]
---
# Automated review of M5-delivery

6 findings in total. The author agreed with 3 and fixed them, and disagreed with 3. After the last round the author decides; the disagreements are listed here for the human.

## Disagreements

| Finding | Decision | Reason |
|---|---|---|
| round 1, F2 | disagree | Valid nit, but .relay/init.sh is in .relay/, which the author may not change; left for the human or the runner |
| round 1, F3 | disagree | Valid nit, but .relay/deploy.sh is in .relay/, which the author may not change; left for the human or the runner |
| round 2, F3 | disagree | The T101 Definition of Done requires eas.json to carry the preview channel (docs/plan/M5-delivery/F10-preview-deploy/T101-eas-web-preview.md:47) and the QA report checked it; I could not confirm that eas deploy works without the file, so removing it risks the deploy |

Details: `docs/review/RV-M5-delivery-*.md`.
