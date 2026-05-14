from rest_framework import serializers
from .models import Survey, SurveyQuestion, SurveyResponse, SurveyAnswer


class SurveyQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyQuestion
        fields = ['id', 'text', 'question_type', 'order', 'options']


class SurveySerializer(serializers.ModelSerializer):
    questions = SurveyQuestionSerializer(many=True, read_only=True)
    response_count = serializers.SerializerMethodField()
    my_response = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = [
            'id', 'title', 'description', 'created_by', 'target_users',
            'is_anonymous', 'is_active', 'deadline', 'questions',
            'response_count', 'my_response', 'created_at',
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_response_count(self, obj):
        return obj.responses.count()

    def get_my_response(self, obj):
        request = self.context.get('request')
        if request:
            return obj.responses.filter(user=request.user).exists()
        return False


class SurveyCreateSerializer(serializers.ModelSerializer):
    questions = SurveyQuestionSerializer(many=True)

    class Meta:
        model = Survey
        fields = [
            'title', 'description', 'target_users', 'is_anonymous', 'is_active',
            'deadline', 'questions',
        ]

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        target_users = validated_data.pop('target_users', [])
        validated_data['created_by'] = self.context['request'].user
        survey = Survey.objects.create(**validated_data)
        survey.target_users.set(target_users)
        for q in questions_data:
            SurveyQuestion.objects.create(survey=survey, **q)
        return survey


class SurveyAnswerSubmitSerializer(serializers.Serializer):
    answers = serializers.ListField(child=serializers.DictField())

    def validate_answers(self, value):
        for item in value:
            if 'question_id' not in item:
                raise serializers.ValidationError('Каждый ответ должен содержать question_id')
        return value


class SurveyResultSerializer(serializers.ModelSerializer):
    results = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = ['id', 'title', 'results']

    def get_results(self, obj):
        results = []
        for question in obj.questions.all():
            answers = SurveyAnswer.objects.filter(question=question)
            if question.question_type == 'text':
                texts = [a.answer_text for a in answers if a.answer_text]
                results.append({'question': question.text, 'type': 'text', 'answers': texts})
            else:
                from collections import Counter
                all_options = []
                for a in answers:
                    all_options.extend(a.answer_options)
                counts = dict(Counter(all_options))
                results.append({'question': question.text, 'type': question.question_type, 'counts': counts})
        return results
