import os

# helper function to locate this dir
here = lambda x: os.path.join(os.path.abspath(os.path.dirname(__file__)), x)

DEBUG = TEMPLATE_DEBUG = True
ROOT_URLCONF = 'run_urls'

# Unused but necessary
DATABASES = { 'default': {} } #required regardless of actual usage
SECRET_KEY = '42'

TEMPLATE_DIRS = (here('templates/'))

STATIC_URL = '/static/'
STATIC_ROOT = here('static')

# Django-compressor (for SCSS files)

INSTALLED_APPS = ['compressor']

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
