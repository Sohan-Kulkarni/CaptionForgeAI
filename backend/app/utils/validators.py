import os
from dataclasses import dataclass
from io import BytesIO

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


@dataclass(frozen=True)
class ValidatedImage:
    bytes: bytes
    format: str
    width: int
    height: int
    content_type: str


def _max_upload_bytes() -> int:
    max_mb = float(os.getenv("MAX_UPLOAD_MB", "8"))
    return int(max_mb * 1024 * 1024)


def _max_pixels() -> int:
    return int(os.getenv("MAX_IMAGE_PIXELS", "20000000"))


Image.MAX_IMAGE_PIXELS = _max_pixels()


def validate_image_upload(file: UploadFile, image_bytes: bytes) -> ValidatedImage:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload an image file.",
        )

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    if len(image_bytes) > _max_upload_bytes():
        max_mb = os.getenv("MAX_UPLOAD_MB", "8")
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image is too large. Maximum upload size is {max_mb} MB.",
        )

    reported_type = (file.content_type or "").lower()
    if reported_type and reported_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type. Please upload a JPG, PNG, or WEBP image.",
        )

    try:
        with Image.open(BytesIO(image_bytes)) as image:
            image.verify()

        with Image.open(BytesIO(image_bytes)) as image:
            image_format = image.format or ""
            width, height = image.size
            detected_type = Image.MIME.get(image_format, reported_type)
    except UnidentifiedImageError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid image.",
        ) from exc
    except Image.DecompressionBombError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image dimensions are too large to process safely.",
        ) from exc

    if image_format not in ALLOWED_FORMATS or detected_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image format. Please upload JPG, PNG, or WEBP.",
        )

    if width * height > _max_pixels():
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image resolution is too large. Try a smaller image.",
        )

    return ValidatedImage(
        bytes=image_bytes,
        format=image_format,
        width=width,
        height=height,
        content_type=detected_type,
    )

