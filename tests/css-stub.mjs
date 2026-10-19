import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./css-stub-hooks.mjs', pathToFileURL('./tests/'));
