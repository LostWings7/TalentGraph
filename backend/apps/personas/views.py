"""REST API Views for Persona Studio & Talent Ingestion."""
import json
import logging
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from apps.employees.models import Employee
from apps.personas.services.demo_loader import DemoPersonaLoader
from apps.personas.services.file_parser import FileParserService
from apps.personas.services.persona_extractor import GeminiPersonaExtractor
from apps.personas.services.persona_creation import PersonaCreationService

logger = logging.getLogger(__name__)

# Base seeded employee IDs (31..60 or 1..30) that are protected from deletion
PROTECTED_EMPLOYEE_IDS = set(range(1, 61))

@api_view(['GET'])
def list_demo_personas_view(request):
    """Lists preloaded demo persona profiles ready for instant ingestion."""
    demos = DemoPersonaLoader.list_demo_personas()
    return Response({'results': demos})

@api_view(['GET'])
def get_demo_persona_files_view(request, demo_id):
    """Returns raw file contents for a specific demo persona."""
    data = DemoPersonaLoader.get_demo_files(demo_id)
    if not data:
        return Response({'error': f"Demo persona '{demo_id}' not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response(data)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def parse_files_view(request):
    """Parses uploaded files or payload into structured textual sections."""
    try:
        files = request.FILES
        data = request.data
        
        # If files uploaded as multipart
        if files:
            parsed = FileParserService.parse_uploaded_files(files)
        else:
            # If payload passed as JSON string/dict
            files_dict = data.get('files', {})
            parsed = FileParserService.parse_uploaded_files(files_dict)

        return Response({
            'success': True,
            'parsed_data': parsed,
            'filenames': parsed.get('filenames', []),
            'sections_detected': {
                'has_resume': bool(parsed.get('resume_text')),
                'projects_count': len(parsed.get('projects', [])),
                'certifications_count': len(parsed.get('certifications', [])),
                'learning_count': len(parsed.get('learning_history', [])),
                'work_history_count': len(parsed.get('work_history', [])),
            }
        })
    except Exception as e:
        logger.exception(f"Error parsing files: {e}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def analyze_persona_view(request):
    """Runs Gemini 3.7 Flash structured extraction on parsed data."""
    try:
        parsed_data = request.data.get('parsed_data', {})
        initial_identity = request.data.get('identity', {})
        
        if not parsed_data and not initial_identity:
            return Response({'error': 'Parsed data or initial identity is required.'}, status=status.HTTP_400_BAD_REQUEST)

        extraction_result = GeminiPersonaExtractor.extract_persona(parsed_data, initial_identity)
        return Response(extraction_result)
    except Exception as e:
        logger.exception(f"Error analyzing persona: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def create_persona_view(request):
    """Persists a reviewed talent persona into the database, generates credentials and role matches."""
    try:
        persona_data = request.data.get('persona', request.data)
        if not persona_data or not persona_data.get('name'):
            return Response({'error': 'Persona payload must include a name.'}, status=status.HTTP_400_BAD_REQUEST)

        profile = getattr(request.user, 'profile', None) if request.user and request.user.is_authenticated else None
        enterprise = profile.enterprise if profile else None
        creator = request.user if request.user and request.user.is_authenticated else None

        result = PersonaCreationService.create_or_update_persona(
            persona_data=persona_data,
            enterprise=enterprise,
            creator_user=creator
        )
        return Response(result, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.exception(f"Error creating persona: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_persona_view(request, pk):
    """Deletes a custom-created talent persona."""
    try:
        emp = Employee.objects.filter(pk=pk).first()
        if not emp:
            return Response({'error': f"Persona #{pk} not found."}, status=status.HTTP_404_NOT_FOUND)

        # Protect initial seeded benchmarks in production
        is_benchmark_db = Employee.objects.count() >= 30
        if is_benchmark_db and emp.id in PROTECTED_EMPLOYEE_IDS:
            return Response(
                {'error': f"Employee #{pk} ({emp.name}) is a protected benchmark persona and cannot be deleted."},
                status=status.HTTP_403_FORBIDDEN
            )

        emp_name = emp.name
        emp.delete()
        return Response({'success': True, 'message': f"Persona '{emp_name}' successfully deleted."})
    except Exception as e:
        logger.exception(f"Error deleting persona #{pk}: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_personas_stats_view(request):
    """Returns overview statistics of all personas in the platform."""
    total_count = Employee.objects.count()
    seeded_count = Employee.objects.filter(id__in=PROTECTED_EMPLOYEE_IDS).count()
    custom_count = max(0, total_count - seeded_count)

    departments = {}
    for emp in Employee.objects.only('department'):
        dept = emp.department or 'Other'
        departments[dept] = departments.get(dept, 0) + 1

    return Response({
        'total_personas': total_count,
        'custom_personas': custom_count,
        'benchmark_personas': seeded_count,
        'departments': departments,
    })
