from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.models.caption import CaptionMode, CaptionResponse
from app.services.caption_service import CaptionServiceError, get_caption_service
from app.utils.validators import validate_image_upload

router = APIRouter(tags=["Captions"])


@router.post("/generate-captions", response_model=CaptionResponse)
async def generate_captions(
    file: UploadFile = File(...),
    mode: CaptionMode = Form(CaptionMode.creative),
) -> CaptionResponse:
    image_bytes = await file.read()
    validated_image = validate_image_upload(file, image_bytes)

    try:
        service = get_caption_service()
        items = service.generate_captions(validated_image.bytes, mode=mode)
    except CaptionServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Caption generation failed. Please try again with another image.",
        ) from exc

    return CaptionResponse(
        captions=[item.text for item in items],
        items=items,
        mode=mode,
        model=service.model_name,
    )

