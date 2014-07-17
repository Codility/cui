'''

    Copyright (C) 2014 Codility Limited. <https://codility.com>

    This file is part of Candidate User Interface (CUI).

    CUI is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version accepted in a public statement
    by Codility Limited.

    CUI is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with CUI.  If not, see <http://www.gnu.org/licenses/>.

'''

import os

# helper function to locate this dir
here = lambda x: os.path.join(os.path.abspath(os.path.dirname(__file__)), x)

DEBUG = TEMPLATE_DEBUG = True
ROOT_URLCONF = 'run_urls'

# Unused, but required by test runner.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'TEST_NAME': ':memory:',
    }
}

# Unused.
SECRET_KEY = '42'

TEMPLATE_DIRS = (here('templates/'))

STATIC_URL = '/static/'
CUI_STATIC_DIR = here('static')
STATICFILES_DIRS = [CUI_STATIC_DIR]

# Django-compressor (for SCSS files)

INSTALLED_APPS = ['django.contrib.staticfiles', 'compressor']

COMPRESS_ENABLED = False
COMPRESS_OFFLINE = False
COMPRESS_PRECOMPILERS = (
    ('text/x-scss', 'bundle exec sass {infile} {outfile} --scss'),
)
COMPRESS_CSS_FILTERS = [
    'compressor.filters.css_default.CssAbsoluteFilter',
    'compressor.filters.cssmin.CSSMinFilter',  # out of the box
]
COMPRESS_OUTPUT_DIR = ''

# See https://github.com/django-compressor/django-compressor/issues/261
COMPRESS_PARSER = 'compressor.parser.HtmlParser'

COMPRESS_ROOT = here('static_auto')

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'compressor.finders.CompressorFinder',
)

# Testing

TEST_RUNNER = 'run_util.CUITestRunner'
