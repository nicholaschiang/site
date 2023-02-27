import type { Dispatch, SetStateAction } from 'react'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import { useCallback, useMemo, useState } from 'react'
import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'

import { Filters } from 'components/filters'
import { Image } from 'components/image'

import {
  FILTER_PARAM,
  JOIN_PARAM,
  filterToPrismaWhere,
  filterToSearchParam,
  filterToString,
  searchParamToFilter,
} from 'filters'
import type { Filter } from 'filters'
import { log } from 'log.server'
import { prisma } from 'db.server'

export type LoaderData = Omit<ProductItemProps, 'index' | 'resultsPerRow'>[]

// users can control prisma queries via url search parameters.
// Ex: /products?f=price:gt:100&f=price:lt:200&j=OR
// ... will return products with a price between 100 and 200.
export const loader: LoaderFunction = async ({ request }) => {
  const { searchParams } = new URL(request.url)
  const filters = searchParams.getAll(FILTER_PARAM).map(searchParamToFilter)
  let join = searchParams.get(JOIN_PARAM)
  if (!join || !['AND', 'OR', 'NOT'].includes(join)) join = 'AND'
  log.debug(
    'getting products... %s',
    filters.map(filterToString).join(` ${join} `),
  )
  const products = (
    await prisma.product.findMany({
      include: { images: true },
      where: { [join]: filters.map(filterToPrismaWhere) },
    })
  ).map((product) => ({
    id: product.id,
    name: product.name,
    imageUrl: product.images[0]?.url,
    // real users don't care about cents. most reputable brands won't include
    // cents in their prices anyway. prices that do include cents are usually
    // intended to be misleading (e.g. $69.70 instead of $70).
    msrp: product.msrp ? Math.round(Number(product.msrp)) : undefined,
  }))
  log.debug('got %d products', products.length)
  return json<LoaderData>(products)
}

export default function ProductsPage() {
  const products = useLoaderData<LoaderData>()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo<Filter[]>(
    () => searchParams.getAll(FILTER_PARAM).map(searchParamToFilter),
    [searchParams],
  )
  const setFilters = useCallback<Dispatch<SetStateAction<Filter[]>>>(
    (action: SetStateAction<Filter[]>) => {
      setSearchParams((prevSearchParams) => {
        let nextFilters: Filter[]
        if (typeof action === 'function') {
          const prevFilters = prevSearchParams
            .getAll(FILTER_PARAM)
            .map(searchParamToFilter)
          nextFilters = action(prevFilters)
        } else {
          nextFilters = action
        }
        const nextSearchParams = new URLSearchParams(prevSearchParams)
        nextSearchParams.delete(FILTER_PARAM)
        nextFilters.forEach((filter) =>
          nextSearchParams.append(FILTER_PARAM, filterToSearchParam(filter)),
        )
        return nextSearchParams
      })
    },
    [setSearchParams],
  )
  const [resultsPerRow, setResultsPerRow] = useState(6)
  return (
    <>
      <Filters modelName='Product' filters={filters} setFilters={setFilters}>
        <ResultsPerRowSelect
          resultsPerRow={resultsPerRow}
          setResultsPerRow={setResultsPerRow}
        />
      </Filters>
      <div className='h-full flex-1 overflow-y-auto overflow-x-hidden px-12 py-6'>
        <ol className='-m-2 flex flex-wrap'>
          {products.map((product, index) => (
            <ProductItem
              {...product}
              key={product.id}
              index={index}
              resultsPerRow={resultsPerRow}
            />
          ))}
        </ol>
      </div>
    </>
  )
}

//////////////////////////////////////////////////////////////////

type ResultsPerRowSelectProps = {
  resultsPerRow: number
  setResultsPerRow: Dispatch<SetStateAction<number>>
}

function ResultsPerRowSelect({
  resultsPerRow,
  setResultsPerRow,
}: ResultsPerRowSelectProps) {
  return (
    <label className='text-xs lowercase text-gray-500 dark:text-gray-400'>
      <input
        type='number'
        value={resultsPerRow}
        onChange={(event) =>
          setResultsPerRow(parseInt(event.currentTarget.value, 10))
        }
        className='w-4 appearance-none bg-transparent text-gray-900 dark:text-gray-100'
      />{' '}
      results per row
    </label>
  )
}

//////////////////////////////////////////////////////////////////

// Eagerly load images for the first two rows of products.
const rowsToEagerLoad = 2

// Images are currently sized w:h = 1:1.25 (e.g. Isabel Marant).
const widthToHeightImageRatio = 1.25

type ProductItemProps = {
  id: number
  name: string
  imageUrl?: string
  msrp?: number
  index: number
  resultsPerRow: number
}

function ProductItem({
  id,
  name,
  imageUrl,
  msrp,
  index,
  resultsPerRow,
}: ProductItemProps) {
  return (
    <li
      className='shrink-0 grow-0'
      style={{ flexBasis: `${(1 / resultsPerRow) * 100}%` }}
    >
      <div className='relative m-2'>
        <div
          className='absolute w-full'
          style={{ paddingTop: `${widthToHeightImageRatio * 100}%` }}
        >
          <Image
            className='absolute top-0 h-full w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800'
            loading={index < resultsPerRow * rowsToEagerLoad ? 'eager' : 'lazy'}
            decoding={
              index < resultsPerRow * rowsToEagerLoad ? 'sync' : 'async'
            }
            src={imageUrl}
            data-image={imageUrl}
            responsive={[200, 300, 400, 500, 600, 700, 800, 900, 1000].map(
              (width) => ({
                size: { width, height: width * widthToHeightImageRatio },
                maxWidth: width * resultsPerRow,
              }),
            )}
          />
        </div>
        <Link prefetch='intent' to={`/products/${id}`}>
          <div
            className='relative mb-2 rounded-md'
            style={{ paddingTop: `${widthToHeightImageRatio * 100}%` }}
          />
          <h2 className='leading-none'>{name}</h2>
          <h3>${msrp}</h3>
        </Link>
      </div>
    </li>
  )
}
