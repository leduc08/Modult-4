# Vietnam tourism v2

Source: https://www.kaggle.com/datasets/vuonglsts/vietnam-tourism-v2

Author: Vương Nguyễn Đình (`vuonglsts`). Dataset version: 1.
Kaggle last-updated date: 2025-10-13. Downloaded: 2026-09-27.
Kaggle license label: **Database: Open Database, Contents: © Original Authors**.
Preserve source attribution and review source/content permissions before redistribution or commercial reuse.

Original files are preserved unchanged:

- `train_vietnam_tourism.json`: training articles, contexts and question/answer annotations.
- `valid_vietnam_tourism.json`: validation split; not indexed in the application.
- `source.zip`: original downloaded archive.

The format is SQuAD-style: `data[].title`, `paragraphs[].context`, `qas[].question`, `answers[].text`, `answer_start`.
This is a text knowledge corpus, not a geospatial database, live price feed or booking inventory.
Some information may be outdated or inaccurate. Prices, opening hours, visa rules and safety advice require current source verification.

`database/tourismKnowledge.ts` loads the training split once on the backend and searches it with BM25, accent normalization and phrase boosts.
Only selected passages are sent to DeepSeek. No model training or fine-tuning occurs.
The validation split shares contexts with training and must not be described as an independent unseen-context evaluation.

Deployment: run the server from the project root and include this directory alongside `dist/`, because the backend reads the JSON file at runtime.

Re-download version 1: https://www.kaggle.com/api/v1/datasets/download/vuonglsts/vietnam-tourism-v2?datasetVersionNumber=1
