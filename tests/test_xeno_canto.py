"""Offline checks; live API access requires an unrestricted connection."""
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import URLError

spec = importlib.util.spec_from_file_location('xeno', Path(__file__).parents[1] / 'scripts/xeno-canto.py')
xeno = importlib.util.module_from_spec(spec)
spec.loader.exec_module(xeno)


class XenoPreparationTest(unittest.TestCase):
    def test_license_selection(self):
        for code in ('by', 'by-sa'):
            self.assertTrue(xeno.license_allowed(f'https://creativecommons.org/licenses/{code}/4.0/'))
        for code in ('by-nc', 'by-nd', 'by-nc-sa'):
            self.assertFalse(xeno.license_allowed(f'https://creativecommons.org/licenses/{code}/4.0/'))
        self.assertFalse(xeno.license_allowed('unknown'))

    def test_network_errors_never_expose_request_credentials(self):
        with patch.object(xeno, 'urlopen', side_effect=URLError('URL contains private-key')):
            with self.assertRaises(RuntimeError) as error:
                xeno.request('https://example.com/?key=private-key')
            self.assertNotIn('private-key', str(error.exception))

    def test_search_encodes_the_query_and_validates_response(self):
        with patch.object(xeno, 'request', return_value=io.BytesIO(b'{"recordings":[]}')) as request:
            self.assertEqual(xeno.search('example-key', 'gen:Pica sp:pica q:A')['recordings'], [])
            self.assertIn('query=gen%3APica+sp%3Apica+q%3AA', request.call_args.args[0])
        with patch.object(xeno, 'request', return_value=io.BytesIO(b'{"error":"invalid"}')):
            with self.assertRaises(RuntimeError):
                xeno.search('example-key', 'q:A')

    def test_download_preserves_credit_and_does_not_overwrite(self):
        recording = dict(id='123', rec='Auteur', lic='https://creativecommons.org/licenses/by-sa/4.0/',
                         file='https://example.com/bird.mp3', **{'file-name': 'bird.mp3'})
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            with patch.object(xeno, 'request', return_value=io.BytesIO(b'original-audio')):
                path = xeno.download(recording, directory)
            self.assertEqual(path.read_bytes(), b'original-audio')
            credit = json.loads((directory / 'XC123.json').read_text())
            self.assertEqual(credit['rec'], 'Auteur')
            self.assertEqual(credit['source'], 'https://xeno-canto.org/123')
            self.assertEqual(len(credit['original_sha256']), 64)
            with self.assertRaises(RuntimeError):
                xeno.download(recording, directory)
            recording['lic'] = 'https://creativecommons.org/licenses/by-nc/4.0/'
            with self.assertRaises(RuntimeError):
                xeno.download(recording, directory)


if __name__ == '__main__':
    unittest.main()
