# Stand-alone Django server for the CUI app.
# Based on https://github.com/readevalprint/mini-django

import os, sys
from django.core.management import execute_manager

import run_settings


if __name__=='__main__':
    execute_manager(run_settings)
