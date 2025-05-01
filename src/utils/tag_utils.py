from typing import Union, List

def parse_tags(tags: Union[str, List[str]]) -> List[str]:
    """
    Parse tags from a string or list and normalize them
    
    Args:
        tags: Tags as a string (comma-separated) or list
        
    Returns:
        List of normalized tags
    """
    if not tags:
        return []
        
    # If tags is a string, split it by commas
    if isinstance(tags, str):
        # Handle both comma-separated and space-separated tags
        if ',' in tags:
            tags_list = [tag.strip() for tag in tags.split(',')]
        else:
            tags_list = [tag.strip() for tag in tags.split()]
    else:
        tags_list = tags
        
    # Normalize tags: lowercase, remove duplicates, remove empty tags
    normalized_tags = [tag.strip().lower() for tag in tags_list if tag.strip()]
    return sorted(set(normalized_tags))
