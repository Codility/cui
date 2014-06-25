# Stand-alone Django server for the CUI app.
# Based on https://github.com/readevalprint/mini-django

import os, sys

from django.core.management import execute_manager


import run_settings

if __name__=='__main__':
    # Try binding to multiple ports in case the first one is not available.
    os.environ.setdefault('DJANGO_LIVE_TEST_SERVER_ADDRESS', 'localhost:8050-8099')
    execute_manager(run_settings)
