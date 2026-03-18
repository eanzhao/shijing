# 诗经

一个无需构建步骤的静态网站，用于阅读《诗经》全文，包含 305 篇诗作、生僻字注音与简短题解。

## 目录说明

- `index.html`、`style.css`、`app.js`、`data.js` 是网站运行所需文件。
- `generate_data.py`、`merge_poems.py`、`build_daya.py`、`build_json.py` 和 `poems_*.json` 是数据整理与生成时保留的源码文件。
- `missing_poems.md`、`poem_format_example.json` 是整理数据时的辅助资料。

## 本地预览

```bash
python3 -m http.server 8000
```

然后访问 <http://localhost:8000>。

## GitHub Pages

这个仓库可以直接从默认分支根目录部署到 GitHub Pages，不需要额外构建流程。
