/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useEffect, Platform } from '@wordpress/element';
import {
	InnerBlocks,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	InspectorControls,
	JustifyToolbar,
	BlockControls,
	useBlockProps,
	store as blockEditorStore,
	withColors,
	PanelColorSettings,
	ContrastChecker,
} from '@wordpress/block-editor';
import { useDispatch, withSelect, withDispatch } from '@wordpress/data';
import { PanelBody, ToggleControl, ToolbarGroup } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useBlockNavigator from './use-block-navigator';

import NavigationPlaceholder from './placeholder';
import PlaceholderPreview from './placeholder-preview';
import ResponsiveWrapper from './responsive-wrapper';

const ALLOWED_BLOCKS = [
	'core/navigation-link',
	'core/search',
	'core/social-links',
	'core/page-list',
	'core/spacer',
	'core/home-link',
];

const LAYOUT = {
	type: 'default',
	alignments: [],
};

function getBlockDOMNode( clientId, doc ) {
	return doc.getElementById( 'block-' + clientId );
}

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

function detectColors( clientId, setColor, setBackground ) {
	const colorsDetectionElement = getBlockDOMNode( clientId, document );
	if ( ! colorsDetectionElement ) {
		return;
	}
	setColor( getComputedStyle( colorsDetectionElement ).color );

	let backgroundColorNode = colorsDetectionElement;
	let backgroundColor = getComputedStyle( backgroundColorNode )
		.backgroundColor;
	while (
		backgroundColor === 'rgba(0, 0, 0, 0)' &&
		backgroundColorNode.parentNode &&
		backgroundColorNode.parentNode.nodeType ===
			backgroundColorNode.parentNode.ELEMENT_NODE
	) {
		backgroundColorNode = backgroundColorNode.parentNode;
		backgroundColor = getComputedStyle( backgroundColorNode )
			.backgroundColor;
	}

	setBackground( backgroundColor );
}

function Navigation( {
	selectedBlockHasDescendants,
	attributes,
	setAttributes,
	clientId,
	hasExistingNavItems,
	isImmediateParentOfSelectedBlock,
	isSelected,
	updateInnerBlocks,
	className,
	backgroundColor,
	setBackgroundColor,
	textColor,
	setTextColor,
	overlayBackgroundColor,
	setOverlayBackgroundColor,
	overlayTextColor,
	setOverlayTextColor,
	subMenuClientId,
	hasSubmenuIndicatorSetting = true,
	hasItemJustificationControls = true,
} ) {
	const [ isPlaceholderShown, setIsPlaceholderShown ] = useState(
		! hasExistingNavItems
	);
	const [ isResponsiveMenuOpen, setResponsiveMenuVisibility ] = useState(
		false
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	const blockProps = useBlockProps( {
		className: classnames(
			className,
			textColor.class,
			backgroundColor.class,
			{
				[ `items-justified-${ attributes.itemsJustification }` ]: attributes.itemsJustification,
				'is-vertical': attributes.orientation === 'vertical',
				'is-responsive': attributes.isResponsive,
				'has-text-color': !! textColor.color || !! textColor.class,
				'has-background':
					!! backgroundColor.color || !! backgroundColor.class,
			}
		),
		style: {
			color: textColor.color,
			backgroundColor: backgroundColor.color,
		},
	} );

	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator(
		clientId
	);

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-navigation__container',
		},
		{
			allowedBlocks: ALLOWED_BLOCKS,
			orientation: attributes.orientation || 'horizontal',
			renderAppender:
				( isImmediateParentOfSelectedBlock &&
					! selectedBlockHasDescendants ) ||
				isSelected
					? InnerBlocks.DefaultAppender
					: false,
			__experimentalAppenderTagName: 'li',
			__experimentalCaptureToolbars: true,
			// Template lock set to false here so that the Nav
			// Block on the experimental menus screen does not
			// inherit templateLock={ 'all' }.
			templateLock: false,
			__experimentalLayout: LAYOUT,
			placeholder: <PlaceholderPreview />,
		}
	);

	// Turn on contrast checker for web only since it's not supported on mobile yet.
	const enableContrastChecking = Platform.OS === 'web';

	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();
	const [
		detectedOverlayBackgroundColor,
		setDetectedOverlayBackgroundColor,
	] = useState();
	const [ detectedOverlayColor, setDetectedOverlayColor ] = useState();

	useEffect( () => {
		if ( ! enableContrastChecking ) {
			return;
		}
		detectColors( clientId, setDetectedColor, setDetectedBackgroundColor );
		if ( subMenuClientId ) {
			detectColors(
				subMenuClientId,
				setDetectedOverlayColor,
				setDetectedOverlayBackgroundColor
			);
		}
	} );

	if ( isPlaceholderShown ) {
		return (
			<div { ...blockProps }>
				<NavigationPlaceholder
					onCreate={ ( blocks, selectNavigationBlock ) => {
						setIsPlaceholderShown( false );
						updateInnerBlocks( blocks );
						if ( selectNavigationBlock ) {
							selectBlock( clientId );
						}
					} }
				/>
			</div>
		);
	}

	const justifyAllowedControls =
		attributes.orientation === 'vertical'
			? [ 'left', 'center', 'right' ]
			: [ 'left', 'center', 'right', 'space-between' ];

	return (
		<>
			<BlockControls>
				{ hasItemJustificationControls && (
					<JustifyToolbar
						value={ attributes.itemsJustification }
						allowedControls={ justifyAllowedControls }
						onChange={ ( value ) =>
							setAttributes( { itemsJustification: value } )
						}
						popoverProps={ {
							position: 'bottom right',
							isAlternate: true,
						} }
					/>
				) }
				<ToolbarGroup>{ navigatorToolbarButton }</ToolbarGroup>
			</BlockControls>
			{ navigatorModal }
			<InspectorControls>
				{ hasSubmenuIndicatorSetting && (
					<PanelBody title={ __( 'Display settings' ) }>
						<ToggleControl
							checked={ attributes.showSubmenuIcon }
							onChange={ ( value ) => {
								setAttributes( {
									showSubmenuIcon: value,
								} );
							} }
							label={ __( 'Show submenu indicator icons' ) }
						/>
						<ToggleControl
							checked={ attributes.isResponsive }
							onChange={ ( value ) => {
								setAttributes( {
									isResponsive: value,
								} );
							} }
							label={ __( 'Enable responsive menu' ) }
						/>
					</PanelBody>
				) }
				<PanelColorSettings
					title={ __( 'Color' ) }
					initialOpen={ false }
					colorSettings={ [
						{
							value: textColor.color,
							onChange: setTextColor,
							label: __( 'Text' ),
						},
						{
							value: backgroundColor.color,
							onChange: setBackgroundColor,
							label: __( 'Background' ),
						},
						{
							value: overlayTextColor.color,
							onChange: setOverlayTextColor,
							label: __( 'Overlay text' ),
						},
						{
							value: overlayBackgroundColor.color,
							onChange: setOverlayBackgroundColor,
							label: __( 'Overlay background' ),
						},
					] }
				>
					{ enableContrastChecking && (
						<>
							<ContrastChecker
								backgroundColor={ detectedBackgroundColor }
								textColor={ detectedColor }
							/>
							<ContrastChecker
								backgroundColor={
									detectedOverlayBackgroundColor
								}
								textColor={ detectedOverlayColor }
							/>
						</>
					) }
				</PanelColorSettings>
			</InspectorControls>
			<nav { ...blockProps }>
				<ResponsiveWrapper
					id={ clientId }
					onToggle={ setResponsiveMenuVisibility }
					isOpen={ isResponsiveMenuOpen }
					isResponsive={ attributes.isResponsive }
				>
					<ul { ...innerBlocksProps }></ul>
				</ResponsiveWrapper>
			</nav>
		</>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const innerBlocks = select( blockEditorStore ).getBlocks( clientId );
		const {
			getClientIdsOfDescendants,
			hasSelectedInnerBlock,
			getSelectedBlockClientId,
		} = select( blockEditorStore );
		const isImmediateParentOfSelectedBlock = hasSelectedInnerBlock(
			clientId,
			false
		);
		const selectedBlockId = getSelectedBlockClientId();
		const selectedBlockHasDescendants = !! getClientIdsOfDescendants( [
			selectedBlockId,
		] )?.length;

		const subMenuClientId = innerBlocks.find(
			( b ) => b.innerBlocks.length
		)?.innerBlocks[ 0 ]?.clientId;
		return {
			isImmediateParentOfSelectedBlock,
			selectedBlockHasDescendants,
			subMenuClientId,
			hasExistingNavItems: !! innerBlocks.length,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateInnerBlocks( blocks ) {
				if ( blocks?.length === 0 ) {
					return false;
				}
				dispatch( blockEditorStore ).replaceInnerBlocks(
					clientId,
					blocks,
					true
				);
			},
		};
	} ),
	withColors(
		{ textColor: 'color' },
		{ backgroundColor: 'color' },
		{ overlayBackgroundColor: 'color' },
		{ overlayTextColor: 'color' }
	),
] )( Navigation );
