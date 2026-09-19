"""File Parser Service for Persona Studio.

Parses raw uploaded documents (TXT, CSV, JSON, Markdown, etc.) and demo payloads into
structured textual context ready for Gemini 3.7 Flash analysis.
"""
import io
import csv
import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class FileParserService:
    @staticmethod
    def parse_csv_content(content_str: str) -> List[Dict[str, str]]:
        """Parses a CSV string into a list of normalized key-value dictionaries."""
        results = []
        try:
            reader = csv.DictReader(io.StringIO(content_str.strip()))
            for row in reader:
                # Normalize keys: lowercase and strip whitespace
                cleaned_row = {
                    k.strip().lower().replace(' ', '_'): v.strip() 
                    for k, v in row.items() if k is not None
                }
                if any(cleaned_row.values()):
                    results.append(cleaned_row)
        except Exception as e:
            logger.warning(f"Error parsing CSV content: {e}")
        return results

    @staticmethod
    def parse_uploaded_files(files_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Parses multiple uploaded files into categorized textual and tabular content.
        
        Expected file keys or filenames:
          - resume: .txt, .pdf, .docx, .md
          - projects: .csv, .json
          - certifications: .csv, .json
          - learning_history: .csv, .json
          - work_history: .csv, .json
        """
        parsed_data = {
            'resume_text': '',
            'projects': [],
            'certifications': [],
            'learning_history': [],
            'work_history': [],
            'raw_sections': {},
            'filenames': []
        }

        for field_name, file_obj in files_dict.items():
            try:
                fname = getattr(file_obj, 'name', field_name).lower()
                parsed_data['filenames'].append(fname)
                
                # Read content as string
                if hasattr(file_obj, 'read'):
                    raw_bytes = file_obj.read()
                    if hasattr(file_obj, 'seek'):
                        file_obj.seek(0)
                    try:
                        content_str = raw_bytes.decode('utf-8')
                    except UnicodeDecodeError:
                        content_str = raw_bytes.decode('latin-1', errors='ignore')
                elif isinstance(file_obj, str):
                    content_str = file_obj
                else:
                    content_str = str(file_obj)

                # Categorize based on field name or filename
                if 'resume' in fname or 'cv' in fname or field_name == 'resume':
                    parsed_data['resume_text'] += "\n" + content_str
                elif 'project' in fname or field_name == 'projects':
                    if fname.endswith('.json'):
                        parsed_data['projects'].extend(json.loads(content_str))
                    else:
                        parsed_data['projects'].extend(FileParserService.parse_csv_content(content_str))
                elif 'cert' in fname or field_name == 'certifications':
                    if fname.endswith('.json'):
                        parsed_data['certifications'].extend(json.loads(content_str))
                    else:
                        parsed_data['certifications'].extend(FileParserService.parse_csv_content(content_str))
                elif 'learn' in fname or 'course' in fname or field_name == 'learning_history':
                    if fname.endswith('.json'):
                        parsed_data['learning_history'].extend(json.loads(content_str))
                    else:
                        parsed_data['learning_history'].extend(FileParserService.parse_csv_content(content_str))
                elif 'work' in fname or 'history' in fname or 'experience' in fname or field_name == 'work_history':
                    if fname.endswith('.json'):
                        parsed_data['work_history'].extend(json.loads(content_str))
                    else:
                        parsed_data['work_history'].extend(FileParserService.parse_csv_content(content_str))
                else:
                    # Fallback generic section
                    parsed_data['raw_sections'][field_name] = content_str
                    if not parsed_data['resume_text']:
                        parsed_data['resume_text'] = content_str

            except Exception as e:
                logger.error(f"Failed to parse uploaded file '{field_name}': {e}")

        return parsed_data

    @staticmethod
    def build_extraction_prompt_context(parsed_data: Dict[str, Any], initial_identity: Optional[Dict[str, Any]] = None) -> str:
        """Assembles parsed files into a clean, comprehensive text prompt for Gemini extraction."""
        context_parts = []

        if initial_identity:
            context_parts.append("=== PROVIDED BASIC IDENTITY ===")
            for k, v in initial_identity.items():
                if v:
                    context_parts.append(f"{k.replace('_', ' ').title()}: {v}")

        if parsed_data.get('resume_text'):
            context_parts.append("\n=== RESUME / CV DOCUMENT ===")
            context_parts.append(parsed_data['resume_text'].strip())

        if parsed_data.get('projects'):
            context_parts.append("\n=== PROJECTS & CONTRIBUTIONS (CSV/TABLE) ===")
            for idx, p in enumerate(parsed_data['projects'], 1):
                p_str = ", ".join([f"{k}: {v}" for k, v in p.items() if v])
                context_parts.append(f"Project #{idx}: {p_str}")

        if parsed_data.get('certifications'):
            context_parts.append("\n=== CERTIFICATIONS & CREDENTIALS ===")
            for idx, c in enumerate(parsed_data['certifications'], 1):
                c_str = ", ".join([f"{k}: {v}" for k, v in c.items() if v])
                context_parts.append(f"Certification #{idx}: {c_str}")

        if parsed_data.get('learning_history'):
            context_parts.append("\n=== LEARNING & COURSEWORK HISTORY ===")
            for idx, l in enumerate(parsed_data['learning_history'], 1):
                l_str = ", ".join([f"{k}: {v}" for k, v in l.items() if v])
                context_parts.append(f"Course #{idx}: {l_str}")

        if parsed_data.get('work_history'):
            context_parts.append("\n=== WORK HISTORY ===")
            for idx, w in enumerate(parsed_data['work_history'], 1):
                w_str = ", ".join([f"{k}: {v}" for k, v in w.items() if v])
                context_parts.append(f"Role #{idx}: {w_str}")

        if parsed_data.get('raw_sections'):
            for sec_name, sec_content in parsed_data['raw_sections'].items():
                context_parts.append(f"\n=== ADDITIONAL SECTION: {sec_name.upper()} ===")
                context_parts.append(sec_content)

        return "\n".join(context_parts)
