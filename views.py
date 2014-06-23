
from django.template.response import SimpleTemplateResponse
from django.conf import settings

def render_cui(context):
    context = context.copy()
    context['STATIC_URL'] = settings.STATIC_URL
    context['DEBUG'] = settings.DEBUG
    context['ticket'] = { 'id': 'TICKET_ID' }
    context['in_devel'] = True
    return SimpleTemplateResponse('cui/cui.html', context)


def cui_test(request):
    '''Scaffolding for candidate interface JS tests.'''

    return render_cui({
        'in_test': True,
        'title': 'CUI tests'
    })

def cui_local(request):
    '''Scaffolding for candidate interface with mock local server.'''

    return render_cui({
        'in_local': True,
        'title': 'CUI'
    })
