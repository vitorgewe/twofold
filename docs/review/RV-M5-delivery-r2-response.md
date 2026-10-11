---
type: review-response
milestone: "[[M5-delivery]]"
round: 2
agreed: 2
disagreed: 1
tags: [review]
---
# Review M5-delivery, round 2: responses

| Finding | Decision | Resolution |
|---|---|---|
| F1 | agree | Fixed in 4a554e3: the deploy job now curls the production URL and fails if COOP same-origin or COEP require-corp is missing; the URL comes from the repository variable PROD_URL, which the human must set after the first deploy; the wasm asset is not checked and the browser check in ADR-0017 is still needed |
| F2 | agree | Fixed in 4a554e3: the deploy job has concurrency group deploy-prod with cancel-in-progress false |
| F3 | disagree | The T101 Definition of Done requires eas.json to carry the preview channel (docs/plan/M5-delivery/F10-preview-deploy/T101-eas-web-preview.md:47) and the QA report checked it; I could not confirm that eas deploy works without the file, so removing it risks the deploy |
