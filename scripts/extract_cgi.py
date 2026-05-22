#!/usr/bin/env python3
"""
Extraction du Code Général des Impôts (PDF → markdown par article)
Utilise la taille de police (14.6pt) pour détecter les numéros d'articles.
Destination : ~/.hermes/rag/cgi/<livre>/article-<num>.md
"""
import re
import shutil
from pathlib import Path
import fitz  # pymupdf

PDF_PATH = Path("/Users/joai/Documents/Hermes/Code général des impôts.pdf")
OUT_DIR  = Path.home() / ".hermes/rag/cgi"

ARTICLE_NUM_SIZE = 14.6  # taille de police des numéros d'articles
TOLERANCE = 0.3


def is_article_num(span):
    size = round(span['size'], 1)
    txt = span['text'].strip()
    if abs(size - ARTICLE_NUM_SIZE) > TOLERANCE:
        return False
    return bool(re.match(r'^\d[\d\-]*(\s+[A-Za-z][\w]*)?\.?$', txt))


def parse_hierarchy(header_line):
    ctx = {}
    parts = [p.strip() for p in re.split(r'\s*[-–]\s*', header_line)]
    for p in parts:
        if re.match(r'Livre', p, re.I):        ctx['livre'] = p
        elif re.match(r'.*[Pp]artie', p):      ctx['partie'] = p
        elif re.match(r'Titre', p, re.I):       ctx['titre'] = p
        elif re.match(r'Chapitre', p, re.I):    ctx['chapitre'] = p
        elif re.match(r'Section', p, re.I):     ctx['section'] = p
    return ctx


def slugify(text):
    text = text.lower().strip()
    for a, b in [('à','a'),('â','a'),('ä','a'),('é','e'),('è','e'),('ê','e'),
                 ('ë','e'),('î','i'),('ï','i'),('ô','o'),('ö','o'),('ù','u'),
                 ('û','u'),('ü','u'),('ç','c'),("'",''),("'","")]:
        text = text.replace(a, b)
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'\s+', '-', text)
    return text[:50].strip('-')


def clean_content(text):
    text = re.sub(r'(?:LOI|Ordonnance|Décret|ORDONNANCE)\s+n[°o]?\s*[\d\-]+[^\n]*', '', text)
    text = re.sub(r'Conseil\s+Constit\.[^\n]*', '', text)
    text = re.sub(r'\s*(Legif\.|Plan\s+|Jp\.Judi\.|Jp\.Admin\.|Juricaf|service-public\.fr)\s*', ' ', text)
    text = re.sub(r'p\.\d+\s+Code général des impôts', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def main():
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True)

    print(f"Extraction de {PDF_PATH.name}...")
    doc = fitz.open(str(PDF_PATH))
    print(f"{len(doc)} pages")

    # Première passe : collecte tous les articles avec leur position (page, index)
    articles = []  # (page_num, article_num_text, content_lines, ctx)
    current_ctx = {}
    current_article = None
    current_lines = []

    def flush_article():
        if current_article:
            articles.append((dict(current_ctx), current_article, '\n'.join(current_lines)))

    for page_num, page in enumerate(doc):
        # Mise à jour contexte hiérarchique
        first_line = page.get_text("text").split('\n')[0].strip()
        ctx_update = parse_hierarchy(first_line)
        if ctx_update:
            current_ctx.update(ctx_update)

        # Extraction par blocs avec info de police
        blocks = page.get_text('dict')['blocks']
        for block in blocks:
            if block['type'] != 0:
                continue
            for line in block['lines']:
                for span in line['spans']:
                    if is_article_num(span):
                        # Nouveau numéro d'article détecté
                        flush_article()
                        current_article = span['text'].strip()
                        current_lines = []
                    elif current_article is not None:
                        txt = span['text']
                        if txt.strip():
                            current_lines.append(txt)

    flush_article()
    doc.close()
    print(f"{len(articles)} articles détectés")

    # Deuxième passe : écriture des fichiers
    written = 0
    skipped = 0
    for ctx, num, content in articles:
        content_clean = clean_content(content)
        if len(content_clean) < 30:
            skipped += 1
            continue

        livre_slug = slugify(ctx.get('livre', 'divers'))
        out_path = OUT_DIR / livre_slug
        out_path.mkdir(parents=True, exist_ok=True)

        filename = f"article-{slugify(num)}.md"
        # Évite les collisions de noms
        filepath = out_path / filename
        if filepath.exists():
            filepath = out_path / f"article-{slugify(num)}-b.md"

        meta_parts = [ctx[k] for k in ['livre','partie','titre','chapitre','section'] if ctx.get(k)]

        md  = f"# Article {num}\n\n"
        md += f"> {' › '.join(meta_parts)}\n\n" if meta_parts else ""
        md += f"Source: CGI | Mise à jour: 2026-04\n\n---\n\n"
        md += content_clean

        filepath.write_text(md, encoding='utf-8')
        written += 1

    files = list(OUT_DIR.glob("**/*.md"))
    print(f"✓ {written} articles écrits ({skipped} trop courts ignorés)")
    print(f"\nDossiers :")
    for d in sorted(OUT_DIR.iterdir()):
        if d.is_dir():
            count = len(list(d.glob("*.md")))
            print(f"  {d.name}/ → {count} articles")

    # Aperçu d'un article
    sample = sorted(files)[50] if len(files) > 50 else files[0]
    print(f"\nAperçu : {sample.name}\n")
    print(sample.read_text()[:500])


if __name__ == "__main__":
    main()
