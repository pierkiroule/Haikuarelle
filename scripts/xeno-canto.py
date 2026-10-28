#!/usr/bin/env python3
"""Prepare local bird recordings; never used by the browser or production app."""
import argparse
import getpass
import hashlib
import json
import os
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import urlopen

API = 'https://xeno-canto.org/api/3/recordings'


def license_allowed(value):
    """Keep attribution and share-alike recordings, excluding NC/ND variants."""
    return bool(re.fullmatch(r'https?://creativecommons\.org/(licenses/(by|by-sa)/[0-9.]+|publicdomain/zero/1\.0)/?', value or ''))


def request(url):
    try:
        return urlopen(url, timeout=30)
    except HTTPError as error:
        raise RuntimeError(f'Xeno-canto : erreur HTTP {error.code}.') from None
    except URLError:
        # urllib errors may contain the complete URL, including the API key.
        raise RuntimeError('Xeno-canto inaccessible : vérifier la connexion et le proxy.') from None


def search(key, query, page=1):
    with request(API + '?' + urlencode({'key': key, 'query': query, 'page': page})) as response:
        try:
            data = json.load(response)
        except (ValueError, UnicodeError):
            raise RuntimeError('Réponse Xeno-canto invalide.') from None
    if not isinstance(data, dict) or not isinstance(data.get('recordings'), list):
        raise RuntimeError('Réponse Xeno-canto inattendue ; vérifier la clé et la requête.')
    return data


def summary(recording):
    return {field: recording.get(field) for field in
            ('id', 'gen', 'sp', 'en', 'rec', 'cnt', 'loc', 'type', 'q', 'length', 'lic', 'url')}


def download(recording, directory):
    if not license_allowed(recording.get('lic')):
        raise RuntimeError('Licence non retenue : choisir CC0, CC BY ou CC BY-SA.')
    identifier = str(recording.get('id', ''))
    if not identifier.isdigit():
        raise RuntimeError('Identifiant d’enregistrement invalide.')
    url = recording.get('file', '')
    if url.startswith('//'):
        url = 'https:' + url
    parsed = urlparse(url)
    if parsed.scheme != 'https' or not parsed.hostname:
        raise RuntimeError('Lien audio HTTPS absent.')
    extension = Path(recording.get('file-name', '')).suffix.lower()
    if extension not in ('.mp3', '.wav', '.ogg', '.flac'):
        extension = '.audio'
    directory.mkdir(parents=True, exist_ok=True)
    audio = directory / f'XC{identifier}{extension}'
    metadata = directory / f'XC{identifier}.json'
    if audio.exists() or metadata.exists():
        raise RuntimeError('Cet extrait existe déjà ; choisir un autre dossier.')
    with request(url) as response:
        content = response.read(32 * 1024 * 1024 + 1)
    if not content or len(content) > 32 * 1024 * 1024:
        raise RuntimeError('Fichier vide ou supérieur à 32 Mio.')
    credit = summary(recording)
    credit.update(source=f'https://xeno-canto.org/{identifier}',
                  original_sha256=hashlib.sha256(content).hexdigest(),
                  bytes=len(content), modifications='Aucune : fichier original téléchargé.')
    audio.write_bytes(content)
    metadata.write_text(json.dumps(credit, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return audio


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    choice = parser.add_mutually_exclusive_group(required=True)
    choice.add_argument('--species', help='Nom scientifique, ex. "Pica pica"')
    choice.add_argument('--download', type=int, metavar='XC_ID', help='Télécharger un enregistrement choisi')
    parser.add_argument('--page', type=int, default=1)
    parser.add_argument('--directory', type=Path, default=Path('/tmp/haikuarelle-xeno-canto'))
    args = parser.parse_args()
    key = os.environ.get('XENO_CANTO_API_KEY') or getpass.getpass('Clé API Xeno-canto (saisie masquée) : ')
    if not key.strip():
        raise RuntimeError('Clé API manquante.')
    if args.download is not None:
        data = search(key.strip(), f'nr:{args.download}')
        recording = next((r for r in data['recordings'] if str(r.get('id')) == str(args.download)), None)
        if recording is None:
            raise RuntimeError('Enregistrement introuvable.')
        print(download(recording, args.directory))
        return
    names = args.species.split()
    if len(names) != 2 or not all(re.fullmatch(r'[A-Za-z-]+', name) for name in names):
        raise RuntimeError('Indiquer un nom scientifique en deux mots.')
    if args.page < 1:
        raise RuntimeError('Le numéro de page doit être positif.')
    data = search(key.strip(), f'gen:{names[0]} sp:{names[1]} q:A', args.page)
    print(json.dumps({'total': data.get('numRecordings'), 'pages': data.get('numPages'),
                      'page': args.page, 'candidates': [summary(r) for r in data['recordings']
                      if license_allowed(r.get('lic'))]}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, OSError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
