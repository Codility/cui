# Stand-alone Django server for the CUI app.
# Based on https://github.com/readevalprint/mini-django

import os, sys

os.environ['DJANGO_SETTINGS_MODULE'] = 'run_settings'
#sys.path += (here('.'),)

if __name__=='__main__':
    # run the development server
    from django.core import management
    management.call_command('runserver','0.0.0.0:8001')
