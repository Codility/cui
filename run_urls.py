
from django.conf.urls.defaults import patterns, url
from django.conf.urls.static import static

import views, run_settings

urlpatterns = patterns(
    'views',
    url(r'^test/$', 'cui_test'),
    url(r'^local/$', 'cui_local')
)

urlpatterns += static(run_settings.STATIC_URL, document_root=run_settings.STATIC_ROOT)
