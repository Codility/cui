
from django.template.response import SimpleTemplateResponse
from django.conf import settings

def cui_test(request):
    '''Scaffolding for candidate interface JS tests.'''

    # Mock ticket, so that the template renders
    context = {}
    context['ticket'] = { 'id': 'TICKET_ID' }
    context['in_test'] = True
    context['title'] = 'CUI tests'
    context['STATIC_URL'] = settings.STATIC_URL
    context['DEBUG'] = settings.DEBUG
    return SimpleTemplateResponse('cui/cui.html', context)
