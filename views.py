'''

    Copyright (C) 2014 Codility Limited. <https://codility.com>

    This file is part of Candidate User Interface (CUI).

    CUI is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version accepted in a public statement
    by Codility Limited.

    CUI is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with CUI.  If not, see <http://www.gnu.org/licenses/>.

'''


from django.template.response import SimpleTemplateResponse
from django.conf import settings

def render_cui(context, template='cui/cui.html'):
    context = context.copy()
    context['STATIC_URL'] = settings.STATIC_URL
    context['DEBUG'] = settings.DEBUG
    context['ticket'] = { 'id': 'TICKET_ID' }
    context['in_devel'] = True
    return SimpleTemplateResponse(template, context)

def cui_sandbox(request):
    '''Scaffolding to test various components of CUI.'''
    return render_cui({
        'in_local': True,
        'title': 'CUI sandbox'
    }, template='cui/sandbox.html')

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
