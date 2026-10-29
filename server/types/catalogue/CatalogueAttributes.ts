import type { TPlaceAttributes } from '~~/server/types/catalogue/PlaceAttributes'
import type { TStayAttributes } from '~~/server/types/catalogue/StayAttributes'
import type { TTransportAttributes } from '~~/server/types/catalogue/TransportAttributes'

export type TCatalogueAttributes = TTransportAttributes | TStayAttributes | TPlaceAttributes
