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
