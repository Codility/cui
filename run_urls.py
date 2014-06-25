
from django.conf.urls import patterns, url
from django.conf.urls.static import static

import views, run_settings

urlpatterns = patterns(
    'views',
    url(r'^test/$', 'cui_test', name='cui_test'),
    url(r'^local/$', 'cui_local', name='cui_local')
)

urlpatterns += static(run_settings.STATIC_URL)
