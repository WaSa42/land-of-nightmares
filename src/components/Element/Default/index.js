import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import clsx from 'clsx';
import noop from 'lodash/noop';
import isEmpty from 'lodash/isEmpty';

import { useTranslation } from 'react-i18next';
import useEnabled from '@react-story-rich/core/hooks/useEnabled';
import useFocus from '@react-story-rich/core/hooks/useFocus';
import useTap from '@react-story-rich/core/hooks/useTap';
import useTimeout from '@react-story-rich/core/hooks/useTimeout';
import useActions from '@react-story-rich/ui/hooks/useActions';
import useProgress from '@react-story-rich/ui/hooks/useProgress';
import usePizzicato from 'hooks/usePizzicato';
import usePizzicatoPlay from 'hooks/usePizzicatoPlay';
import useVolume from 'hooks/useVolume';
import usePizzicatoAutoStop from 'hooks/usePizzicatoAutoStop';
import useDialog from 'hooks/useDialog';

import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import Alert from '@material-ui/lab/Alert';
import Progress from '@react-story-rich/ui/components/Progress';

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
  },
  cardContent: {
    '&:last-child': {
      padding: theme.spacing(2),
    },
  },
  cardActions: {
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
  },
  hint: {
    marginTop: theme.spacing(1),
  },
}));

const DefaultElement = forwardRef((props, ref) => {
  const classes = useStyles();
  const { t } = useTranslation('UI');

  const {
    actions,
    allowAudio,
    children,
    className,
    dialog,
    hint,
    injected,
    media,
    onEnable,
    onTap,
    onTimeout,
    readOnly,
    settings,
    text,
    typographyProps,
    timeout,
    ...passThroughProps
  } = props;

  // Sound
  const [sound, isSoundLoaded] = usePizzicato({ path: dialog }, injected.enabled);
  const [
    onDialogTap,
    onDialogTimeout,
    dialogTimeout,
  ] = useDialog(sound, allowAudio, isSoundLoaded, props);

  usePizzicatoPlay(sound, allowAudio, isSoundLoaded, true);
  useVolume(sound, { audio: settings.audio, volume: settings.dialogVolume });
  usePizzicatoAutoStop(sound, injected);

  // Events
  const [handleTap, handleKeyPress] = useTap(onDialogTap, readOnly, injected);
  const [hasActions, Actions, actionRef] = useActions(actions, injected, { t });
  const hasProgress = useProgress(onDialogTimeout, dialogTimeout, injected, hasActions);

  useEnabled(onEnable, injected);
  useTimeout(onDialogTimeout, dialogTimeout, injected);

  // Element & refs
  const elementRef = useRef(null);
  const disabled = useMemo(() => (
    !injected.enabled || readOnly || hasActions
  ), [hasActions, injected.enabled, readOnly]);

  useImperativeHandle(ref, () => ({ focus: elementRef.current.focus }));
  useFocus(hasActions ? actionRef : elementRef, injected);

  return (
    <Card className={clsx(classes.root, className)} {...passThroughProps}>
      <CardActionArea
        disabled={disabled}
        onClick={handleTap}
        onKeyPress={handleKeyPress}
        readOnly={readOnly}
        ref={elementRef}
      >
        {media && <CardMedia {...media} />}
        <CardContent className={classes.cardContent}>
          {text ? <Typography align="center" {...typographyProps}>{children}</Typography> : children}
          {(settings.hints && !isEmpty(hint)) ? (
            <Alert variant="outlined" severity="info" className={classes.hint}>{hint}</Alert>
          ) : null}
        </CardContent>
      </CardActionArea>
      {hasActions && (
        <CardActions
          className={classes.cardActions}
          disableSpacing
        >
          {Actions}
        </CardActions>
      )}
      {hasProgress && (
        <Progress
          timeout={timeout}
          onTimeout={onTimeout}
          enabled={injected.enabled}
        />
      )}
    </Card>
  );
});

DefaultElement.propTypes = {
  /**
   * Array of Material UI Button props object
   * @see {@link https://material-ui.com/api/button/#button-api | MUI Button API}
   */
  actions: PropTypes.arrayOf(PropTypes.object),
  /**
   * @ignore
   */
  allowAudio: PropTypes.bool.isRequired,
  /**
   * Your own content displayed in a CardContent component
   * @see {@link https://material-ui.com/components/cards/#card | MUI Card demo}
   */
  children: PropTypes.node.isRequired,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * A path of a dialog to play when card is enabled;
   */
  dialog: PropTypes.string,
  /**
   * A helper text
   */
  hint: PropTypes.string,
  /**
   * A set of props injected by the Story renderer
   */
  injected: PropTypes.shape({
    /**
     * If set to false, component will not be focused when being enabled.
     */
    autoFocus: PropTypes.bool.isRequired,
    /**
     * A Flag for indicating if the Element is currently active
     */
    enabled: PropTypes.bool.isRequired,
    /**
     * The location of the Element in the story tree
     */
    key: PropTypes.number.isRequired,
    /**
     * A set of navigation methods
     * @see Navigation Class description
     */
    nav: PropTypes.object.isRequired,
  }),
  /**
   * Object of Material UI CardMedia props
   * @see {@link https://material-ui.com/api/card-media/#cardmedia-api | MUI CardMedia API}
   */
  media: PropTypes.object,
  /**
   * Callback triggered when Element is enabled by the Story.
   */
  onEnable: PropTypes.func,
  /**
   * Callback triggered when Element is enabled and is clicked or key pressed.
   */
  onTap: PropTypes.func,
  /**
   * Callback triggered when Element is enabled and the timeout delay is reached.
   */
  onTimeout: PropTypes.func,
  /**
   * If set to true, the enabled Element cannot be "tapped" but *onTimeout* can still be called.
   * Useful if you want to wait for an audio to finish before making tapping possible.
   *
   * Note that a component with a noop onTap is considered as readOnly: true
   */
  readOnly: PropTypes.bool,
  /**
   * @ignore
   */
  settings: PropTypes.shape({
    audio: PropTypes.bool.isRequired,
    darkMode: PropTypes.bool.isRequired,
    dialogVolume: PropTypes.number.isRequired,
    hints: PropTypes.bool.isRequired,
    musicVolume: PropTypes.number.isRequired,
    soundVolume: PropTypes.number.isRequired,
    tableTopMode: PropTypes.bool.isRequired,
  }).isRequired,
  /**
   * If true, will render children directly in a Material UI Typography component
   */
  text: PropTypes.bool,
  /**
   * The delay *onTimeout* will be waiting before being triggered.
   */
  timeout: PropTypes.number,
  /**
   * Object of Material UI Typography props
   * @see {@link https://material-ui.com/api/typography/#typography-api | MUI Typography API}
   */
  typographyProps: PropTypes.object,
};

DefaultElement.defaultProps = {
  actions: [],
  className: '',
  dialog: '',
  hint: '',
  injected: undefined,
  media: null,
  onEnable: noop,
  onTap: null,
  onTimeout: null,
  readOnly: false,
  text: false,
  timeout: 0,
  typographyProps: {},
};

export default connect((state) => ({
  allowAudio: state.allowAudio,
  settings: state.settings,
}), {})(DefaultElement);
