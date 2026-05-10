from enum import Enum
from typing import TypeVar

from sqlalchemy import Enum as SqlEnum


EnumType = TypeVar("EnumType", bound=Enum)


def enum_column_type(enum_class: type[EnumType], name: str) -> SqlEnum:
    return SqlEnum(
        enum_class,
        values_callable=lambda values: [item.value for item in values],
        name=name,
        native_enum=False,
        create_constraint=True,
        validate_strings=True,
    )
