function surveyShow(dialog_element) {
    var survey_placeholder = $('.survey_placeholder', dialog_element);
    if(survey_placeholder.size() == 1) {
        var survey = $('#survey');
        survey[0].parentNode.removeChild(survey[0]);
        survey_placeholder.replaceWith(survey);
        survey.show();
    }
}

function surveyFilled() {
    var $survey = $('#survey');
    return !($survey.find('input:checked').length === 0 &&
             $survey.find('textarea').val() === '');

}

function surveySubmit(url, callback) {
    var form = $('#survey_form');
    var form_data = form.serialize();
    $.ajax({
        type: 'POST',
        url: url,
        data: form_data,
        timeout: 1000,
        complete: callback
    });
}
