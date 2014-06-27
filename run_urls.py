
from django.conf.urls import patterns, url

import views, run_settings

urlpatterns = patterns(
    'views',
    url(r'^test/$', 'cui_test', name='cui_test'),
    url(r'^local/$', 'cui_local', name='cui_local')
)
